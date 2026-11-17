"""
AAPDA Lens Main Service Engine.
Unifies Citizen Evidence Analysis, Satellite Intelligence, and Environmental Context.
Adheres to strict AI Safety Guidelines:
- AI assists, humans decide.
- requires_human_review is ALWAYS True.
- Confidence score is a heuristic assessment score, not statistical probability.
- Missing EXIF or GPS does not prove fraud.
- Duplicate images do not prove an incident is fake (citizens reshare media).
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

from app.services.aapda_lens.location_analysis import (
    haversine_distance_km,
    check_gps_mismatch,
    is_within_jk_region,
)
from app.services.aapda_lens.temporal_analysis import (
    parse_utc_timestamp,
    check_temporal_consistency,
)
from app.services.aapda_lens.text_analysis import (
    compute_text_similarity,
    extract_disaster_entities,
    detect_contradictions,
    assess_evidence_completeness,
)
from app.services.aapda_lens.image_analysis import (
    compute_image_hashes,
    compare_image_hashes,
    detect_duplicate_images,
)
from app.services.aapda_lens.metadata_analysis import (
    extract_image_metadata,
    calculate_sha256,
)
from app.services.aapda_lens.satellite.base import BaseSatelliteProvider
from app.services.aapda_lens.satellite.provider import get_satellite_provider
from app.services.aapda_lens.satellite.correlation import correlate_satellite_evidence
from app.services.aapda_lens.satellite.models import ObservationStatus


class LensAnalysisOutput(BaseModel):
    """
    Standard schema for the comprehensive multi-source evidence intelligence assessment.
    """
    assessment_status: str  # "corroborated", "unverified", "needs_field_dispatch", "conflicting_evidence", "suspected_duplicate"
    confidence_score: float = Field(0.0, ge=0.0, le=1.0)
    confidence_explanation: str = "Heuristic assessment score combining multi-source consistency and sensor coverage. Not a statistical probability."
    duplicate_report_ids: List[str] = Field(default_factory=list)
    evidence_quality: Dict[str, Any] = Field(default_factory=dict)
    location_consistency: Dict[str, Any] = Field(default_factory=dict)
    temporal_consistency: Dict[str, Any] = Field(default_factory=dict)
    image_analysis: Dict[str, Any] = Field(default_factory=dict)
    satellite_correlation: Dict[str, Any] = Field(default_factory=dict)
    environmental_correlation: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    reasons: List[str] = Field(default_factory=list)
    evidence_sources: List[str] = Field(default_factory=list)
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    requires_human_review: bool = True

    model_config = ConfigDict(from_attributes=True)


def _to_dict_report(rep: Any) -> Dict[str, Any]:
    """Converts a Pydantic model, SQLAlchemy model, or dict into a standardized dictionary."""
    if isinstance(rep, dict):
        return rep
    data = {}
    for attr in [
        "id", "report_id", "title", "description", "lat", "lng",
        "created_at", "source", "evidence_json", "type", "district",
        "image_bytes", "image_path", "image_phash", "claimed_capture_time",
        "evidence_lat", "evidence_lng"
    ]:
        if hasattr(rep, attr):
            data[attr] = getattr(rep, attr)
    if "report_id" not in data and "id" in data:
        data["report_id"] = str(data["id"])
    return data


def analyze_incident(
    reports: Union[List[Any], Any],
    satellite_provider: Optional[BaseSatelliteProvider] = None,
    satellite_observations: Optional[List[Any]] = None,
    environmental_context: Optional[Dict[str, Any]] = None,
    existing_catalog: Optional[List[Dict[str, Any]]] = None,
) -> LensAnalysisOutput:
    """
    Main verification and multi-source evidence evaluation function.

    Evaluates:
    1. Citizen text descriptions (similarity, contradictions, hazard entities).
    2. Citizen media (EXIF, SHA-256 post-ingestion hash, perceptual image hashing, duplicate detection).
    3. Spatial consistency (Haversine distance between reported site and evidence GPS).
    4. Temporal consistency (Staleness >7d/>30d, future timestamp checks).
    5. Satellite correlation (Report-triggered lookup with mock or real Copernicus/NASA provider).
    6. Environmental context (Rainfall, weather, nearby road network).
    """
    if not isinstance(reports, list):
        reports_list = [_to_dict_report(reports)]
    else:
        reports_list = [_to_dict_report(r) for r in reports]

    if not reports_list:
        return LensAnalysisOutput(
            assessment_status="unverified",
            confidence_score=0.10,
            warnings=["No incident reports provided for analysis."],
            reasons=["Empty evidence set."],
            requires_human_review=True,
        )

    primary_report = reports_list[0]
    rep_lat = float(primary_report.get("lat", 0.0))
    rep_lng = float(primary_report.get("lng", 0.0))
    rep_time = parse_utc_timestamp(primary_report.get("created_at")) or datetime.now(timezone.utc)
    rep_desc = primary_report.get("description") or primary_report.get("title") or ""
    rep_type = primary_report.get("type", "landslide")

    warnings: List[str] = []
    reasons: List[str] = []
    evidence_sources: List[str] = ["citizen_reports"]
    duplicate_report_ids: List[str] = []

    # 1. Geographic & Location Analysis
    in_jk = is_within_jk_region(rep_lat, rep_lng)
    evidence_lat = primary_report.get("evidence_lat")
    evidence_lng = primary_report.get("evidence_lng")
    gps_check = check_gps_mismatch(rep_lat, rep_lng, evidence_lat, evidence_lng)
    
    if not in_jk:
        warnings.append("Reported coordinates lie outside expected Jammu & Kashmir disaster monitoring boundary.")
    if gps_check.get("warning"):
        warnings.append(gps_check["warning"])

    location_consistency = {
        "is_within_disaster_zone": in_jk,
        "reported_coordinates": {"lat": rep_lat, "lng": rep_lng},
        "gps_check": gps_check,
    }

    # 2. Temporal Analysis
    claimed_capture = primary_report.get("claimed_capture_time")
    temp_check = check_temporal_consistency(
        reported_at=rep_time,
        evidence_captured_at=claimed_capture,
        evidence_uploaded_at=primary_report.get("uploaded_at"),
    )
    if temp_check.get("warnings"):
        warnings.extend(temp_check["warnings"])
    if temp_check.get("reasons"):
        reasons.extend(temp_check["reasons"])

    temporal_consistency = temp_check

    # 3. Citizen Text Analysis & Contradictions
    entities = extract_disaster_entities(rep_desc)
    contradictions = detect_contradictions(reports_list)
    if contradictions.get("has_contradiction"):
        warnings.extend(contradictions.get("warnings", []))

    # Text completeness
    has_photo = bool(primary_report.get("image_bytes") or primary_report.get("image_path") or primary_report.get("image_phash"))
    has_gps = bool(evidence_lat is not None and evidence_lng is not None)
    completeness = assess_evidence_completeness(
        description=rep_desc,
        has_image=has_photo,
        has_gps=has_gps,
        has_timestamp=bool(claimed_capture or primary_report.get("created_at")),
    )

    # 4. Multi-Report Text Similarity / Duplicates
    if len(reports_list) > 1:
        for other in reports_list[1:]:
            sim = compute_text_similarity(rep_desc, other.get("description", ""))
            if sim["is_duplicate_text"]:
                dup_id = other.get("report_id", "unknown")
                duplicate_report_ids.append(dup_id)
                warnings.append(
                    f"Report text closely mirrors report {dup_id} ({sim['match_category']}, score: {sim['combined_score']:.2f})."
                )

    # 5. Image & Metadata Analysis
    image_analysis_result: Dict[str, Any] = {
        "has_image": has_photo,
        "is_duplicate": False,
        "details": None,
    }
    
    img_data = primary_report.get("image_bytes") or primary_report.get("image_path")
    if img_data:
        evidence_sources.append("citizen_photographs")
        meta = extract_image_metadata(img_data)
        if meta.get("warnings"):
            warnings.extend(meta["warnings"])
        image_analysis_result["metadata"] = meta

        try:
            hashes = compute_image_hashes(img_data)
            image_analysis_result["hashes"] = hashes
            
            # Check against catalog if provided
            if existing_catalog:
                dup_res = detect_duplicate_images(hashes["phash"], existing_catalog)
                image_analysis_result["is_duplicate"] = dup_res["is_duplicate_found"]
                if dup_res["is_duplicate_found"]:
                    warnings.extend(dup_res["warnings"])
        except Exception as e:
            warnings.append(f"Image hashing note: {str(e)}")

    # 6. Satellite Evidence Analysis
    sat_provider = satellite_provider or get_satellite_provider()
    sat_res = correlate_satellite_evidence(
        incident_lat=rep_lat,
        incident_lng=rep_lng,
        incident_time=rep_time,
        provider=sat_provider,
        incident_type=rep_type,
    )
    evidence_sources.append(f"satellite_{sat_res.data_provenance.value.lower()}")
    if sat_res.warnings:
        warnings.extend(sat_res.warnings)
    if sat_res.reasons:
        reasons.extend(sat_res.reasons)

    satellite_correlation_dict = sat_res.model_dump()

    # 7. Environmental & Geographic Context
    environmental_correlation: Dict[str, Any] = {
        "has_context": False,
        "rainfall_risk": "unknown",
        "weather_alignment": "unverified",
    }
    if environmental_context:
        environmental_correlation["has_context"] = True
        evidence_sources.append("environmental_weather_station")
        rainfall_mm = environmental_context.get("rainfall_mm_per_hour", 0.0)
        
        if rainfall_mm > 30.0:
            environmental_correlation["rainfall_risk"] = "critical_torrential"
            reasons.append(f"Weather sensors confirm torrential rainfall ({rainfall_mm:.1f} mm/h), elevating landslide hazard.")
        elif rainfall_mm > 10.0:
            environmental_correlation["rainfall_risk"] = "elevated_moderate"
            reasons.append(f"Moderate precipitation ({rainfall_mm:.1f} mm/h) recorded in sector.")
        else:
            environmental_correlation["rainfall_risk"] = "low_or_none"

    # 8. Heuristic Confidence Scoring (Safety: NOT statistical probability)
    # Baseline confidence starts at 0.50
    confidence = 0.50

    # Evidence completeness factor (+/- 0.20)
    confidence += (completeness["completeness_score"] - 0.5) * 0.30

    # Corroboration from satellite
    if sat_res.status == ObservationStatus.SUPPORTING_OBSERVATION_AVAILABLE:
        confidence += 0.25
        reasons.append("Confidence boosted by independent satellite sensor corroboration.")
    elif sat_res.status == ObservationStatus.CONFLICTING_OBSERVATION_DETECTED:
        confidence -= 0.30
        warnings.append("Confidence reduced due to conflicting satellite radar observation.")
    elif sat_res.status == ObservationStatus.INSUFFICIENT_COVERAGE_OR_QUALITY:
        reasons.append("Satellite imagery inconclusive due to cloud cover; relying on terrestrial evidence.")

    # Location consistency factor
    if not in_jk:
        confidence -= 0.25
    if gps_check.get("status") == "mismatch":
        confidence -= 0.20

    # Temporal staleness factor
    if temp_check.get("is_stale"):
        confidence -= 0.25
    if not temp_check.get("is_consistent"):
        confidence -= 0.15

    # Contradictions
    if contradictions.get("has_contradiction"):
        confidence -= 0.20

    # Environmental synergy
    if environmental_context and environmental_context.get("rainfall_mm_per_hour", 0.0) > 20.0:
        confidence += 0.10

    # Clamp confidence between 0.10 and 0.95
    confidence_score = round(max(0.10, min(0.95, confidence)), 2)

    # 9. Assessment Status Synthesis
    if contradictions.get("has_contradiction") or sat_res.status == ObservationStatus.CONFLICTING_OBSERVATION_DETECTED:
        assessment_status = "conflicting_evidence"
    elif duplicate_report_ids or image_analysis_result.get("is_duplicate"):
        assessment_status = "suspected_duplicate"
    elif (
        sat_res.status == ObservationStatus.SUPPORTING_OBSERVATION_AVAILABLE
        and confidence_score >= 0.70
        and not temp_check.get("is_stale")
    ):
        assessment_status = "corroborated"
    elif confidence_score >= 0.65 and completeness["completeness_score"] >= 0.70:
        assessment_status = "corroborated"
    elif confidence_score < 0.50 or not has_photo or not has_gps:
        assessment_status = "needs_field_dispatch"
    else:
        assessment_status = "unverified"

    return LensAnalysisOutput(
        assessment_status=assessment_status,
        confidence_score=confidence_score,
        confidence_explanation="Heuristic assessment score based on multi-source citizen, satellite, and environmental corroboration. Not a statistical probability.",
        duplicate_report_ids=duplicate_report_ids,
        evidence_quality=completeness,
        location_consistency=location_consistency,
        temporal_consistency=temporal_consistency,
        image_analysis=image_analysis_result,
        satellite_correlation=satellite_correlation_dict,
        environmental_correlation=environmental_correlation,
        warnings=warnings,
        reasons=reasons,
        evidence_sources=evidence_sources,
        analyzed_at=datetime.now(timezone.utc),
        requires_human_review=True,  # Safety mandate: AI never authorizes or verifies autonomously
    )
