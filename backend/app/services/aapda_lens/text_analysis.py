"""
Text Analysis & Natural Language Heuristics for AAPDA Lens.
Powered by RapidFuzz for token similarity, entity extraction, and contradictory report detection.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from rapidfuzz import fuzz


HAZARD_KEYWORDS = {
    "landslide": ["landslide", "rockfall", "mudslide", "debris flow", "land slip", "falling rocks"],
    "flood": ["flood", "flash flood", "waterlogging", "river overflow", "submerged", "cloudburst"],
    "avalanche": ["avalanche", "snow slide", "heavy snowfall", "blizzard"],
    "road_damage": ["road blocked", "road closed", "bridge collapsed", "culvert washed", "pavement crack", "crater"],
    "structure_collapse": ["building collapsed", "house damaged", "roof fell", "retaining wall failure"],
}

CORRIDOR_KEYWORDS = [
    "nh-44", "nh44", "jammu-srinagar", "panthyal", "mehar", "cafeteria morh", "marog",
    "ramban", "banihal", "batote", "chenani", "udhampur", "anantnag", "qazigund",
    "nh-107", "mughal road", "sinthan top", "zojila", "doda", "kishtwar", "chenab",
]

# Contradictory pattern pairs: (pattern_A, pattern_B, description)
CONTRADICTION_RULES: List[Tuple[re.Pattern, re.Pattern, str]] = [
    (
        re.compile(r"\b(road\s+(is\s+)?(clear|open|passable|normal)|traffic\s+moving)\b", re.IGNORECASE),
        re.compile(r"\b(road\s+(is\s+)?(blocked|closed|impassable|washed\s+away)|landslide\s+blocking)\b", re.IGNORECASE),
        "Direct road status contradiction: One report claims road is open/clear, while another claims road is blocked/closed.",
    ),
    (
        re.compile(r"\b(bridge\s+(is\s+)?(intact|safe|open|operational))\b", re.IGNORECASE),
        re.compile(r"\b(bridge\s+(is\s+)?(collapsed|washed\s+away|broken|destroyed))\b", re.IGNORECASE),
        "Infrastructure contradiction: Conflicting claims about bridge status (intact vs collapsed/washed away).",
    ),
    (
        re.compile(r"\b(water\s+level\s+(is\s+)?(receding|normal|dropping|safe))\b", re.IGNORECASE),
        re.compile(r"\b(flash\s+flood|water\s+rising|river\s+overflowing|raging\s+torrent)\b", re.IGNORECASE),
        "Flood severity contradiction: Conflicting claims regarding water levels (receding/normal vs flash flood/overflowing).",
    ),
    (
        re.compile(r"\b(no\s+(damage|casualties|injuries)|all\s+safe|minor\s+inconvenience)\b", re.IGNORECASE),
        re.compile(r"\b(heavy\s+damage|fatalities|people\s+trapped|severe\s+casualties|buried)\b", re.IGNORECASE),
        "Impact severity contradiction: One report claims no casualties/damage while another reports severe casualties/trapped citizens.",
    ),
]


def clean_text(text: str) -> str:
    """Normalizes text by removing excessive whitespace and standardizing casing."""
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip().lower()


def compute_text_similarity(text1: str, text2: str) -> Dict[str, Any]:
    """
    Computes lexical and token similarity between two text descriptions using RapidFuzz.
    Evaluates:
    - token_sort_ratio: invariant to word reordering.
    - partial_ratio: detects substring copy-paste reports.
    - standard ratio: direct Levenshtein-based similarity.
    """
    t1 = clean_text(text1)
    t2 = clean_text(text2)

    if not t1 or not t2:
        return {
            "token_sort_ratio": 0.0,
            "partial_ratio": 0.0,
            "combined_score": 0.0,
            "is_duplicate_text": False,
            "match_category": "empty",
        }

    token_sort = fuzz.token_sort_ratio(t1, t2) / 100.0
    partial = fuzz.partial_ratio(t1, t2) / 100.0
    direct = fuzz.ratio(t1, t2) / 100.0

    # Weighted combined similarity: emphasize token ordering invariance
    combined = (token_sort * 0.50) + (partial * 0.30) + (direct * 0.20)

    if combined >= 0.85:
        category = "near_verbatim_duplicate"
        is_dup = True
    elif combined >= 0.65:
        category = "highly_similar"
        is_dup = True
    elif combined >= 0.45:
        category = "moderate_overlap"
        is_dup = False
    else:
        category = "distinct"
        is_dup = False

    return {
        "token_sort_ratio": round(token_sort, 3),
        "partial_ratio": round(partial, 3),
        "direct_ratio": round(direct, 3),
        "combined_score": round(combined, 3),
        "is_duplicate_text": is_dup,
        "match_category": category,
    }


def extract_disaster_entities(text: str) -> Dict[str, Any]:
    """
    Extracts recognized disaster hazard types and key geographic corridors/landmarks.
    """
    text_lower = clean_text(text)
    detected_hazards: List[str] = []
    detected_corridors: List[str] = []

    for hazard, keywords in HAZARD_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            detected_hazards.append(hazard)

    for corridor in CORRIDOR_KEYWORDS:
        if corridor in text_lower:
            detected_corridors.append(corridor)

    return {
        "detected_hazards": detected_hazards,
        "detected_corridors": detected_corridors,
        "has_recognized_hazard": len(detected_hazards) > 0,
        "has_recognized_corridor": len(detected_corridors) > 0,
    }


def detect_contradictions(reports: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Examines a collection of reports for conflicting or contradictory claims.
    Each report in `reports` should have:
    - 'report_id': str
    - 'description': str
    - 'source': Optional[str]
    """
    conflicting_pairs: List[Dict[str, Any]] = []

    for i in range(len(reports)):
        for j in range(i + 1, len(reports)):
            rep1 = reports[i]
            rep2 = reports[j]
            desc1 = rep1.get("description", "")
            desc2 = rep2.get("description", "")

            for pat_a, pat_b, explanation in CONTRADICTION_RULES:
                # Check A in rep1 and B in rep2, or B in rep1 and A in rep2
                a_in_1 = bool(pat_a.search(desc1))
                b_in_2 = bool(pat_b.search(desc2))
                b_in_1 = bool(pat_b.search(desc1))
                a_in_2 = bool(pat_a.search(desc2))

                if (a_in_1 and b_in_2) or (b_in_1 and a_in_2):
                    conflicting_pairs.append({
                        "report_1_id": rep1.get("report_id"),
                        "report_2_id": rep2.get("report_id"),
                        "contradiction_type": explanation,
                        "quote_1": desc1[:150],
                        "quote_2": desc2[:150],
                    })

    has_contradiction = len(conflicting_pairs) > 0
    warnings = []
    if has_contradiction:
        warnings.append(
            f"Detected {len(conflicting_pairs)} contradictory statements between citizen reports. "
            "Dispatch field verifier to reconcile on-ground road & river conditions."
        )

    return {
        "has_contradiction": has_contradiction,
        "conflicting_pairs": conflicting_pairs,
        "warnings": warnings,
    }


def assess_evidence_completeness(
    description: str,
    has_image: bool,
    has_gps: bool,
    has_timestamp: bool,
) -> Dict[str, Any]:
    """
    Assesses the completeness and detail level of citizen-submitted evidence.
    Generates an explainable score between 0.0 and 1.0.
    """
    score = 0.0
    checks = {}
    missing_items = []

    # Text length and quality
    words = len(clean_text(description).split())
    if words >= 15:
        score += 0.35
        checks["text_detail"] = "detailed"
    elif words >= 5:
        score += 0.20
        checks["text_detail"] = "minimal"
    else:
        checks["text_detail"] = "insufficient"
        missing_items.append("detailed narrative description")

    # Image
    if has_image:
        score += 0.30
        checks["photographic_evidence"] = True
    else:
        checks["photographic_evidence"] = False
        missing_items.append("photographic evidence")

    # GPS
    if has_gps:
        score += 0.20
        checks["gps_coordinates"] = True
    else:
        checks["gps_coordinates"] = False
        missing_items.append("device GPS coordinate attachment")

    # Timestamp
    if has_timestamp:
        score += 0.15
        checks["capture_timestamp"] = True
    else:
        checks["capture_timestamp"] = False
        missing_items.append("verifiable capture timestamp")

    score = round(min(1.0, score), 2)
    quality_label = (
        "high" if score >= 0.80 else
        "moderate" if score >= 0.50 else
        "low"
    )

    return {
        "completeness_score": score,
        "quality_label": quality_label,
        "checks": checks,
        "missing_items": missing_items,
        "summary": f"Evidence completeness rated {quality_label} ({int(score * 100)}%). Missing: {', '.join(missing_items) if missing_items else 'None'}.",
    }
