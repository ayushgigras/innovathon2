"""
RahatGrid Relief Request Prioritization Engine.
Calculates deterministic, transparent priority scores based on survival needs,
medical urgency, population impact, settlement isolation, and wait time.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


CRITICAL_SURVIVAL_KEYWORDS = [
    "water", "drinking water", "food", "rations", "infant food", "baby food",
    "medicine", "insulin", "antivenom", "first aid", "trauma kit", "blood",
    "shelter", "tents", "blankets", "oxygen", "heating",
]

SEVERITY_WEIGHTS = {
    "critical": 40.0,
    "high": 25.0,
    "medium": 15.0,
    "low": 5.0,
}


def _get_field(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def prioritize_requests(requests: List[Any]) -> List[Dict[str, Any]]:
    """
    Ranks relief requests deterministically based on humanitarian urgency factors:
    1. Critical survival items (water, food, urgent medical supplies) (+30 pts)
    2. Medical / disaster severity level (critical/high) (+10 to +40 pts)
    3. Settlement isolation (+25 pts)
    4. Population scale factor (+5 to +15 pts)
    5. Elapsed wait time since submission (+1 pt per hour, up to +15 pts)

    Returns sorted list with explicit priority_rank and explainable reasons.
    """
    scored_requests: List[Dict[str, Any]] = []
    now = datetime.now(timezone.utc)

    for req in requests:
        r_id = str(_get_field(req, "id") or _get_field(req, "request_id", "RR-UNKNOWN"))
        settlement_id = str(_get_field(req, "settlement_id") or _get_field(req, "settlementId", ""))
        settlement_name = _get_field(req, "settlement_name") or _get_field(req, "settlementName", settlement_id)
        raw_priority = str(_get_field(req, "priority", "medium")).lower()

        reasons: List[str] = []
        score = 0.0

        # 1. Severity weight
        sev_pts = SEVERITY_WEIGHTS.get(raw_priority, 15.0)
        score += sev_pts
        reasons.append(f"Base urgency level '{raw_priority}' (+{sev_pts:.0f} pts).")

        # 2. Settlement isolation factor
        is_isolated = bool(_get_field(req, "is_isolated", False))
        if is_isolated:
            score += 25.0
            reasons.append("Settlement is isolated by road closures — external supply line cut off (+25 pts).")

        # 3. Item criticality (water, food, medicine)
        items = _get_field(req, "items", [])
        if isinstance(items, str):
            import json
            try:
                items = json.loads(items)
            except Exception:
                items = []

        has_survival = False
        has_medical = False
        for item in items:
            name = str(_get_field(item, "name", "")).lower()
            cat = str(_get_field(item, "category", "")).lower()
            if any(k in name or k in cat for k in ["water", "food", "ration", "baby"]):
                has_survival = True
            if any(k in name or k in cat for k in ["med", "first aid", "trauma", "insulin", "oxygen"]):
                has_medical = True

        if has_medical:
            score += 20.0
            reasons.append("Request includes emergency medical supplies / trauma kits (+20 pts).")
        if has_survival:
            score += 15.0
            reasons.append("Request includes essential survival rations / drinking water (+15 pts).")

        # 4. Population / affected scale
        people_affected = _get_field(req, "people_affected") or _get_field(req, "population", 0)
        if people_affected and people_affected > 0:
            scale_pts = min(15.0, (people_affected / 100.0) * 2.0)
            score += scale_pts
            reasons.append(f"Impact scale: {people_affected} affected individuals (+{scale_pts:.1f} pts).")

        # 5. Elapsed wait time
        created_at = _get_field(req, "created_at") or _get_field(req, "createdAt")
        if created_at:
            if isinstance(created_at, str):
                try:
                    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except Exception:
                    dt = now
            else:
                dt = created_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            elapsed_hours = max(0.0, (now - dt).total_seconds() / 3600.0)
            wait_pts = min(15.0, elapsed_hours * 1.0)
            if wait_pts > 0:
                score += wait_pts
                reasons.append(f"Waiting time: {elapsed_hours:.1f} hours elapsed since submission (+{wait_pts:.1f} pts).")

        final_score = round(score, 2)
        scored_requests.append({
            "request_id": r_id,
            "settlement_id": settlement_id,
            "settlement_name": settlement_name,
            "priority_score": final_score,
            "raw_priority": raw_priority,
            "is_isolated": is_isolated,
            "items": items,
            "reasons": reasons,
            "original_request": req,
        })

    # Sort descending by priority_score
    scored_requests.sort(key=lambda x: x["priority_score"], reverse=True)

    for rank, item in enumerate(scored_requests, start=1):
        item["priority_rank"] = rank

    return scored_requests
