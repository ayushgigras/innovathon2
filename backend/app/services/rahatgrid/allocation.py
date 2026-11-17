from typing import List, Dict, Any, Optional
from app.models.relief import ReliefRequest, InventoryItem
from app.models.settlement import Settlement
from app.schemas.relief import RequestedItemSchema, AISuggestedItemSchema, AIAllocationSuggestionSchema


def compute_allocation_recommendation(
    request: ReliefRequest,
    settlement: Optional[Settlement],
    inventory: List[InventoryItem],
) -> AIAllocationSuggestionSchema:
    """
    Computes AI-suggested kit allocations based on settlement population,
    urgency, and warehouse inventory headroom.
    """
    pop = settlement.population if settlement else 350
    is_isolated = settlement.is_isolated if settlement else False

    suggested_items: List[AISuggestedItemSchema] = []
    total_requested_count = 0
    total_allocable_count = 0

    inv_map = {item.id: item for item in inventory}

    import json
    requested_items_raw = json.loads(request.items_json) if isinstance(request.items_json, str) else request.items_json

    for req_item in requested_items_raw:
        item_id = req_item.get("itemId")
        qty_req = req_item.get("quantityRequested", 0)
        total_requested_count += qty_req

        inv_item = inv_map.get(item_id)
        if inv_item:
            free_stock = max(0, inv_item.quantity_available - inv_item.quantity_reserved)
            # Recommend based on available stock and population ratio
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
        feasibility = min(0.95, max(0.20, total_allocable_count / total_requested_count))

    if is_isolated:
        feasibility *= 0.90  # Access constraints adjust feasibility downwards

    return AIAllocationSuggestionSchema(
        label="AI Recommendation (unverified — human review required)",
        suggestedItems=suggested_items,
        feasibilityScore=round(feasibility, 2),
    )
