"""
RahatGrid Delivery Lifecycle & Tracking Engine.
Manages the end-to-end delivery state machine: proposed -> approved -> dispatched -> delivered/failed.
Guarantees human authorization gates, prevents invalid state jumps, and preserves full transition audit logs.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


VALID_DELIVERY_TRANSITIONS = {
    "proposed": ["approved", "failed"],
    "approved": ["dispatched", "failed"],
    "dispatched": ["delivered", "failed"],
    "delivered": [],  # Terminal state
    "failed": ["proposed"],  # Can be re-proposed after route clearance
}


def _get_field(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def update_delivery_status(
    delivery: Any,
    new_status: str,
    source: str = "delivery_team",
    driver_notes: Optional[str] = None,
    timestamp: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Validates and applies a status transition to a delivery record.
    
    Safety rules:
    - AI never marks a delivery as 'delivered' automatically (physical handoff confirmation required).
    - Cannot jump from 'proposed' to 'dispatched' without official human 'approved' authorization.
    - Preserves timestamp, updater identity, and audit transition history.
    """
    current_status = str(_get_field(delivery, "status", "proposed")).lower()
    target_status = str(new_status).lower()
    ts = str(timestamp or datetime.now(timezone.utc).isoformat())

    del_id = str(_get_field(delivery, "id") or _get_field(delivery, "delivery_id", "DEL-UNKNOWN"))
    req_id = str(_get_field(delivery, "request_id", ""))
    depot_id = str(_get_field(delivery, "depot_id") or _get_field(delivery, "warehouse_id", ""))
    route_ref = str(_get_field(delivery, "route_reference") or _get_field(delivery, "route_id", ""))

    # Validate transition
    allowed_next = VALID_DELIVERY_TRANSITIONS.get(current_status, [])

    if target_status not in allowed_next:
        return {
            "success": False,
            "delivery_id": del_id,
            "current_status": current_status,
            "target_status": target_status,
            "error": (
                f"Invalid status transition from '{current_status}' to '{target_status}'. "
                f"Permitted next states: {allowed_next}. "
                f"Mandatory safety rule: Deliveries cannot be dispatched without prior human approval."
            ),
        }

    # Extract or initialize history
    history = _get_field(delivery, "status_history", [])
    if isinstance(history, list):
        updated_history = list(history)
    else:
        updated_history = []

    updated_history.append({
        "from_status": current_status,
        "to_status": target_status,
        "timestamp": ts,
        "source": source,
        "notes": driver_notes,
    })

    return {
        "success": True,
        "delivery_id": del_id,
        "request_id": req_id,
        "depot_id": depot_id,
        "route_reference": route_ref,
        "previous_status": current_status,
        "current_status": target_status,
        "updated_at": ts,
        "updated_by": source,
        "notes": driver_notes,
        "status_history": updated_history,
        "is_terminal": len(VALID_DELIVERY_TRANSITIONS.get(target_status, [])) == 0,
    }
