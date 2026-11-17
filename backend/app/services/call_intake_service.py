"""
Emergency Helpline Call Transcript Intake Service.
Parses transcripts from citizen phone calls to emergency numbers (e.g. 112 / DDMA Control Room),
extracts incident descriptions, identifies hazard categories, maps mentioned geographical locations,
detects urgency indicators, identifies missing information, and creates structured incident reports.
"""

import re
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# Known mountainous sectors and approximate coordinates
GEOGRAPHIC_SECTOR_MAP = {
    "panthyal": {"name": "Panthyal (NH-44 Sector)", "district": "Ramban", "lat": 33.244, "lng": 75.258},
    "peera": {"name": "Peera (NH-44 Approach)", "district": "Ramban", "lat": 33.220, "lng": 75.240},
    "ramban": {"name": "Ramban Town Hub", "district": "Ramban", "lat": 33.244, "lng": 75.258},
    "banihal": {"name": "Banihal North Portal", "district": "Ramban", "lat": 33.500, "lng": 75.200},
    "khari": {"name": "Khari Settlement", "district": "Ramban", "lat": 33.280, "lng": 75.285},
    "batote": {"name": "Batote Junction", "district": "Ramban", "lat": 33.150, "lng": 75.320},
    "shopian": {"name": "Shopian (Mughal Road)", "district": "Shopian", "lat": 33.720, "lng": 74.830},
    "doda": {"name": "Doda Chenab Valley", "district": "Doda", "lat": 33.148, "lng": 75.546},
    "kishtwar": {"name": "Kishtwar Valley", "district": "Kishtwar", "lat": 33.310, "lng": 75.760},
    "katra": {"name": "Katra Foothills", "district": "Reasi", "lat": 32.990, "lng": 74.950},
    "jammu": {"name": "Jammu City Center", "district": "Jammu", "lat": 32.729, "lng": 74.864},
    "srinagar": {"name": "Srinagar Valley", "district": "Srinagar", "lat": 34.080, "lng": 74.790},
}

HAZARD_KEYWORDS = {
    "landslide": ["landslide", "landslides", "rockfall", "mudslide", "shooting stones", "debris", "mountain slide", "slope failure"],
    "flood": ["flood", "floods", "flooding", "overflow", "overflowing", "river overflow", "water rising", "submerged", "chenab river", "inundation", "waterlogging"],
    "cloudburst": ["cloudburst", "cloud burst", "torrential downpour", "sudden deluge", "flash flood"],
    "road_block": ["blocked", "blockage", "obstruction", "jammed", "traffic halted", "boulders on road", "tree fallen"],
    "bridge_damage": ["bridge collapse", "bridge damage", "culvert washed away", "pillar damaged"],
    "avalanche": ["avalanche", "avalanches", "snow slide", "blizzard"],
}

URGENCY_KEYWORDS = {
    "critical": ["trapped", "injured", "buried", "life threatening", "urgent rescue", "falling boulders", "people stuck inside", "ambulance unable to pass"],
    "high": ["multiple vehicles stranded", "completely cut off", "cannot move", "heavy rain", "water entering houses"],
    "medium": ["slow moving traffic", "minor slide", "partial lane blocked"],
}


def parse_call_transcript(
    transcript: str,
    caller_phone: Optional[str] = None,
    call_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Parses a recorded or live emergency phone call transcript and converts it into a structured
    incident report candidate for the DDMA Control Room.
    """
    clean_text = transcript.strip()
    lower_text = clean_text.lower()

    report_id = f"RPT-CALL-{uuid.uuid4().hex[:6].upper()}"
    timestamp_iso = datetime.now(timezone.utc).isoformat()

    # 1. Identify Hazard Category
    detected_category = "other"
    category_matches = []
    for cat, keywords in HAZARD_KEYWORDS.items():
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", lower_text):
                category_matches.append(cat)
                break
    if category_matches:
        detected_category = category_matches[0]

    # 2. Extract Mentioned Geographic Locations
    matched_sector = None
    for loc_key, loc_info in GEOGRAPHIC_SECTOR_MAP.items():
        if re.search(r"\b" + re.escape(loc_key) + r"\b", lower_text):
            matched_sector = loc_info
            break

    # 3. Detect Urgency
    detected_severity = "medium"
    urgency_reasons = []
    for sev in ["critical", "high", "medium"]:
        for kw in URGENCY_KEYWORDS.get(sev, []):
            if kw in lower_text:
                detected_severity = sev
                urgency_reasons.append(f"Caller mentioned '{kw}'")
                break
        if urgency_reasons:
            break

    # 4. Check for Missing Information
    missing_fields = []
    if not matched_sector:
        missing_fields.append("Exact geographic location unconfirmed from caller description")
    if "vehicle" not in lower_text and "car" not in lower_text and "truck" not in lower_text:
        missing_fields.append("Number of stranded vehicles unknown")
    if "injury" not in lower_text and "casualty" not in lower_text and "injured" not in lower_text:
        missing_fields.append("Casualty and injury count unconfirmed")
    if not caller_phone:
        missing_fields.append("Caller phone number missing for follow-up")

    # 5. Build Structured Incident Report
    extracted_title = f"{detected_category.replace('_', ' ').title()} reported via emergency call"
    if matched_sector:
        extracted_title += f" near {matched_sector['name']}"

    return {
        "report_id": report_id,
        "source": "phone_call",
        "call_id": call_id or f"CALL-{uuid.uuid4().hex[:4].upper()}",
        "caller_phone": caller_phone or "Unlisted Emergency Caller",
        "raw_transcript": clean_text,
        "extracted_category": detected_category,
        "extracted_severity": detected_severity,
        "extracted_location": {
            "sector_name": matched_sector["name"] if matched_sector else "Unspecified J&K Sector",
            "district": matched_sector["district"] if matched_sector else "Ramban",
            "lat": matched_sector["lat"] if matched_sector else 33.244,
            "lng": matched_sector["lng"] if matched_sector else 75.258,
            "confidence": 0.85 if matched_sector else 0.40,
        },
        "urgency_indicators": urgency_reasons or ["Standard incident call intake"],
        "missing_information": missing_fields,
        "recommended_action": "Assign local field officer patrol for physical confirmation.",
        "received_at": timestamp_iso,
        "status": "queued_for_review",
    }
