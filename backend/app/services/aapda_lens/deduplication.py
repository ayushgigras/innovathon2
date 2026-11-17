import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from app.models.incident import Incident
from app.schemas.verification import DuplicateCandidateInfo, VerificationAnalysisResponse


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def analyze_incident_verification(
    target: Incident, all_incidents: List[Incident]
) -> VerificationAnalysisResponse:
    """
    Evaluates corroboration, duplicate likelihood and uncertainty for an incident.
    Deterministic heuristic service adhering to the AI safety principles.
    """
    duplicate_candidates: List[DuplicateCandidateInfo] = []
    uncertainty_flags: List[str] = []

    # 1. Duplicate Detection Heuristic
    max_similarity = 0.0
    for other in all_incidents:
        if other.id == target.id:
            continue

        reasons = []
        score = 0.0

        # Location proximity (< 5km is close for mountainous regions)
        dist_km = haversine_distance_km(target.lat, target.lng, other.lat, other.lng)
        if dist_km < 2.0:
            score += 0.45
            reasons.append(f"High location proximity ({dist_km:.1f}km)")
        elif dist_km < 5.0:
            score += 0.25
            reasons.append(f"Moderate location proximity ({dist_km:.1f}km)")

        # Same incident type
        if target.type == other.type:
            score += 0.30
            reasons.append(f"Matching incident type ({target.type})")

        # Time window (< 4 hours)
        t_target = target.created_at.replace(tzinfo=timezone.utc) if target.created_at.tzinfo is None else target.created_at
        t_other = other.created_at.replace(tzinfo=timezone.utc) if other.created_at.tzinfo is None else other.created_at
        time_diff_hours = abs((t_target - t_other).total_seconds()) / 3600.0

        if time_diff_hours < 2.0:
            score += 0.25
            reasons.append(f"Reported within {time_diff_hours:.1f}h window")
        elif time_diff_hours < 6.0:
            score += 0.15
            reasons.append(f"Reported within {time_diff_hours:.1f}h window")

        similarity = min(1.0, score)
        if similarity >= 0.50:
            duplicate_candidates.append(
                DuplicateCandidateInfo(
                    incident_id=other.id,
                    title=other.title,
                    district=other.district,
                    similarity_score=round(similarity, 2),
                    reasons=reasons,
                )
            )
            if similarity > max_similarity:
                max_similarity = similarity

    # 2. Uncertainty & Confidence Scoring
    confidence = 0.85
    consistency = 0.90

    # Evidence check
    has_evidence = False
    if target.evidence_json and target.evidence_json != "[]":
        has_evidence = True
    else:
        confidence -= 0.15
        uncertainty_flags.append("No photographic evidence attached")

    # Source credibility check
    if target.source == "field_officer":
        confidence += 0.05
    elif target.source == "citizen_app":
        confidence -= 0.05
        uncertainty_flags.append("Uncorroborated single citizen report")

    if max_similarity > 0.60:
        uncertainty_flags.append(f"Possible duplicate of incident(s): {', '.join([c.incident_id for c in duplicate_candidates])}")
        confidence -= 0.10

    confidence = max(0.20, min(0.99, confidence))
    duplicate_prob = max_similarity

    if duplicate_prob > 0.60:
        rec_action = "Review flagged duplicate pair before verification to avoid duplicate dispatch"
    elif confidence >= 0.75:
        rec_action = "High confidence — recommend verification by DDMA officer"
    else:
        rec_action = "Low to medium confidence — dispatch field officer for physical corroboration"

    return VerificationAnalysisResponse(
        incident_id=target.id,
        confidence=round(confidence, 2),
        duplicate_probability=round(duplicate_prob, 2),
        consistency_score=round(consistency, 2),
        uncertainty_flags=uncertainty_flags,
        is_duplicate_candidate=(duplicate_prob >= 0.50),
        duplicate_candidates=duplicate_candidates,
        recommended_action=rec_action,
        analyzed_at=datetime.now(timezone.utc),
    )
