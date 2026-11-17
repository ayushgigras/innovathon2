"""
RahatGrid Allocation Recommendation Engine.
Computes deterministic multi-request relief allocations, prevents double-allocation,
verifies physical stock headroom and road accessibility, and enforces human authorization.
"""

import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import networkx as nx

from app.models.relief import ReliefRequest, InventoryItem
from app.models.settlement import Settlement
from app.schemas.relief import RequestedItemSchema, AISuggestedItemSchema, AIAllocationSuggestionSchema
from app.services.rahatgrid.prioritization import prioritize_requests
from app.services.rahatgrid.inventory import get_available_headroom, check_depot_accessibility


def _get_field(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def recommend_allocations(
    requests: List[Any],
    inventory: List[Any],
    route_results: Optional[Dict[str, Any]] = None,
    road_graph: Optional[nx.Graph] = None,
) -> Dict[str, Any]:
    """
    Evaluates a batch of relief requests against warehouse inventory headroom and route accessibility.
    
    Principles applied:
    - Requests are processed in strict priority order (highest urgency first).
    - Prevents double allocation: inventory state is tracked and decremented across requests.
    - Prevents allocating from inaccessible depots cut off by road closures.
    - Never allocates negative quantities.
    - Identifies shortages and requests requiring human intervention.
    - AI only recommends: human_approval_required is ALWAYS True.
    """
    prioritized = prioritize_requests(requests)

    # Initialize working inventory tracker to prevent double-allocation
    working_stock: Dict[str, Dict[str, Any]] = {}
    for inv in inventory:
        inv_id = str(_get_field(inv, "id", "RI-UNKNOWN"))
        name = str(_get_field(inv, "name", inv_id))
        warehouse_id = str(_get_field(inv, "warehouse_id") or _get_field(inv, "warehouseId", "WH-MAIN"))
        unit = str(_get_field(inv, "unit", "units"))
        headroom = get_available_headroom(inv)

        working_stock[inv_id] = {
            "name": name,
            "warehouse_id": warehouse_id,
            "unit": unit,
            "free_headroom": headroom,
            "initial_headroom": headroom,
        }

    recommendations: List[Dict[str, Any]] = []
    shortages_summary: Dict[str, Any] = {}
    unfulfilled_requests: List[Dict[str, Any]] = []
    depot_accessibility_warnings: List[str] = []

    for req_info in prioritized:
        req_id = req_info["request_id"]
        settlement_id = req_info["settlement_id"]
        settlement_name = req_info["settlement_name"]
        items = req_info["items"]

        allocated_items: List[Dict[str, Any]] = []
        shortage_items: List[Dict[str, Any]] = []
        total_req_count = 0
        total_alloc_count = 0

        # Check route feasibility if depot and settlement are mapped
        depot_accessible = True
        access_warning = None

        for item in items:
            item_id = str(_get_field(item, "itemId") or _get_field(item, "id", "ITEM"))
            item_name = _get_field(item, "name", item_id)
            qty_req = int(_get_field(item, "quantityRequested") or _get_field(item, "quantity", 0))
            total_req_count += qty_req

            inv_entry = working_stock.get(item_id)

            if not inv_entry:
                shortage_items.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "requested": qty_req,
                    "allocated": 0,
                    "shortage": qty_req,
                    "reason": f"Item '{item_name}' (ID: {item_id}) not cataloged in active district inventory.",
                })
                continue

            wh_id = inv_entry["warehouse_id"]

            # Route accessibility check from warehouse to settlement
            if road_graph:
                acc_check = check_depot_accessibility(wh_id, settlement_id, road_graph)
                if not acc_check["is_accessible"]:
                    depot_accessible = False
                    access_warning = acc_check["warning"]
                    depot_accessibility_warnings.append(access_warning)
                    shortage_items.append({
                        "item_id": item_id,
                        "item_name": item_name,
                        "requested": qty_req,
                        "allocated": 0,
                        "shortage": qty_req,
                        "reason": f"Supply depot '{wh_id}' is cut off by road closures from reaching '{settlement_name}'.",
                    })
                    continue

            # Calculate allocable quantity against free headroom
            free_qty = inv_entry["free_headroom"]

            if free_qty >= qty_req:
                # Fully allocable
                allocated_qty = qty_req
                inv_entry["free_headroom"] -= allocated_qty
                allocated_items.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "warehouse_id": wh_id,
                    "quantity": allocated_qty,
                    "status": "fully_allocated",
                })
                total_alloc_count += allocated_qty
            elif free_qty > 0:
                # Partial allocation
                allocated_qty = free_qty
                shortage_qty = qty_req - free_qty
                inv_entry["free_headroom"] = 0
                allocated_items.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "warehouse_id": wh_id,
                    "quantity": allocated_qty,
                    "status": "partially_allocated",
                })
                shortage_items.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "requested": qty_req,
                    "allocated": allocated_qty,
                    "shortage": shortage_qty,
                    "reason": f"Partial stock available: allocated {allocated_qty} {inv_entry['unit']}s, shortage of {shortage_qty} {inv_entry['unit']}s in {wh_id}.",
                })
                total_alloc_count += allocated_qty
            else:
                # Complete stock-out
                shortage_items.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "requested": qty_req,
                    "allocated": 0,
                    "shortage": qty_req,
                    "reason": f"Stock depleted: 0 {inv_entry['unit']}s remaining in warehouse '{wh_id}'.",
                })

        feasibility_score = 0.0
        if total_req_count > 0:
            feasibility_score = round(min(1.0, max(0.0, total_alloc_count / float(total_req_count))), 2)

        has_shortage = len(shortage_items) > 0
        if has_shortage:
            unfulfilled_requests.append({
                "request_id": req_id,
                "settlement_name": settlement_name,
                "unfulfilled_items": shortage_items,
            })
            for s in shortage_items:
                shortages_summary[s["item_name"]] = shortages_summary.get(s["item_name"], 0) + s["shortage"]

        recommendations.append({
            "request_id": req_id,
            "settlement_id": settlement_id,
            "settlement_name": settlement_name,
            "priority_rank": req_info["priority_rank"],
            "priority_score": req_info["priority_score"],
            "feasibility_score": feasibility_score,
            "allocated_items": allocated_items,
            "shortage_items": shortage_items,
            "is_fully_fulfilled": (not has_shortage),
            "depot_accessible": depot_accessible,
            "access_warning": access_warning,
            "reasons": req_info["reasons"],
            "requires_human_approval": True,
        })

    return {
        "status": "success",
        "total_requests_evaluated": len(requests),
        "recommended_allocations": recommendations,
        "unfulfilled_requests_count": len(unfulfilled_requests),
        "unfulfilled_requests": unfulfilled_requests,
        "shortages_summary": shortages_summary,
        "depot_accessibility_warnings": list(set(depot_accessibility_warnings)),
        "human_approval_required": True,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "safety_principle": "AI allocates nothing autonomously. An authorized official must sign off before physical dispatch.",
    }


def validate_allocation(allocation: Any, inventory: List[Any]) -> Dict[str, Any]:
    """
    Validates that a human-approved or requested allocation does not exceed actual physical inventory headroom.
    """
    inv_map = {str(_get_field(i, "id")): i for i in inventory}
    items = _get_field(allocation, "items", [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except Exception:
            items = []

    errors = []
    for item in items:
        item_id = str(_get_field(item, "itemId") or _get_field(item, "id", ""))
        qty = int(_get_field(item, "quantityRequested") or _get_field(item, "quantity", 0))

        inv_item = inv_map.get(item_id)
        if not inv_item:
            errors.append(f"Item '{item_id}' not found in district inventory.")
            continue

        headroom = get_available_headroom(inv_item)
        if qty > headroom:
            errors.append(
                f"Requested allocation of {qty} exceeds available unreserved stock ({headroom}) for '{_get_field(inv_item, 'name', item_id)}'."
            )

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
    }


# ─── Backward-Compatible Single-Request Allocation ────────────────────────────

def compute_allocation_recommendation(
    request: ReliefRequest,
    settlement: Optional[Settlement],
    inventory: List[InventoryItem],
) -> AIAllocationSuggestionSchema:
    """
    Computes AI-suggested kit allocations based on settlement population,
    urgency, and warehouse inventory headroom (maintains backward compatibility).
    """
    pop = settlement.population if settlement else 350
    is_isolated = settlement.is_isolated if settlement else False

    suggested_items: List[AISuggestedItemSchema] = []
    total_requested_count = 0
    total_allocable_count = 0

    inv_map = {item.id: item for item in inventory}
    requested_items_raw = json.loads(request.items_json) if isinstance(request.items_json, str) else request.items_json

    for req_item in (requested_items_raw or []):
        item_id = req_item.get("itemId")
        qty_req = req_item.get("quantityRequested", 0)
        total_requested_count += qty_req

        inv_item = inv_map.get(item_id)
        if inv_item:
            free_stock = max(0, inv_item.quantity_available - inv_item.quantity_reserved)
            recommended_qty = min(qty_req, free_stock)
            total_allocable_count += recommended_qty

            rationale = (
                f"Population {pop} (isolated: {'yes' if is_isolated else 'no'}). "
                f"Stock availability: {free_stock} {inv_item.unit}s remaining in warehouse {inv_item.warehouse_id}."
            )
            suggested_items.append(
                AISuggestedItemSchema(
                    itemId=item_id,
                    quantity=recommended_qty,
                    rationale=rationale,
                )
            )
        else:
            suggested_items.append(
                AISuggestedItemSchema(
                    itemId=item_id,
                    quantity=qty_req,
                    rationale=f"Requested {qty_req} units; verify localized district depot availability.",
                )
            )
            total_allocable_count += qty_req

    feasibility = 0.85
    if total_requested_count > 0:
        feasibility = min(0.95, max(0.20, total_allocable_count / float(total_requested_count)))

    if is_isolated:
        feasibility *= 0.90

    return AIAllocationSuggestionSchema(
        label="AI Recommendation (unverified — human review required)",
        suggestedItems=suggested_items,
        feasibilityScore=round(feasibility, 2),
    )
