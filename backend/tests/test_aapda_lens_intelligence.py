"""
Comprehensive Test Suite for AAPDA Lens Multi-Source Evidence Intelligence Engine.
Tests citizen report text similarity, image hashing, EXIF handling, temporal staleness,
GPS distance checks, contradictory reports, satellite correlation, and AI safety principles.
"""

import io
from datetime import datetime, timezone, timedelta
from PIL import Image, ImageDraw
import pytest

from app.services.aapda_lens import (
    analyze_incident,
    compute_text_similarity,
    detect_contradictions,
    assess_evidence_completeness,
    compute_image_hashes,
    compare_image_hashes,
    detect_duplicate_images,
    extract_image_metadata,
    calculate_sha256,
    check_temporal_consistency,
    parse_utc_timestamp,
    haversine_distance_km,
    check_gps_mismatch,
    is_within_jk_region,
    MockSatelliteProvider,
    correlate_satellite_evidence,
    ObservationStatus,
    DataProvenance,
    SatelliteObservation,
    SatellitePlatform,
    SensorType,
)


def create_synthetic_image(color="white", pattern="rectangle") -> bytes:
    """Helper to generate a synthetic PIL image with distinct geometric features."""
    img = Image.new("RGB", (256, 256), color=color)
    draw = ImageDraw.Draw(img)
    if pattern == "rectangle":
        draw.rectangle([30, 30, 180, 180], fill="black")
    elif pattern == "ellipse":
        draw.ellipse([40, 20, 200, 220], fill="yellow")
    elif pattern == "cross":
        draw.line([(0, 0), (256, 256)], fill="red", width=16)
        draw.line([(0, 256), (256, 0)], fill="red", width=16)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ============================================================================
# 1. Citizen Evidence Text Analysis Tests
# ============================================================================

def test_text_similarity_near_duplicate():
    text1 = "Severe landslide blocking NH-44 near Ramban Panthyal, huge boulders on the highway."
    text2 = "Massive landslide blocking NH-44 near Ramban Panthyal with huge boulders on highway."
    res = compute_text_similarity(text1, text2)

    assert res["is_duplicate_text"] is True
    assert res["combined_score"] > 0.80
    assert res["match_category"] in ("near_verbatim_duplicate", "highly_similar")


def test_text_similarity_distinct():
    text1 = "Landslide blocking NH-44 at Panthyal."
    text2 = "Medical supplies needed urgently for hospital dispensary in Doda district."
    res = compute_text_similarity(text1, text2)

    assert res["is_duplicate_text"] is False
    assert res["combined_score"] < 0.40
    assert res["match_category"] == "distinct"


def test_contradictory_report_detection():
    reports = [
        {"report_id": "REP-01", "description": "NH-44 road is clear and traffic moving normally near Panthyal."},
        {"report_id": "REP-02", "description": "Massive landslide blocking highway at Panthyal, road is completely closed."},
    ]
    res = detect_contradictions(reports)

    assert res["has_contradiction"] is True
    assert len(res["conflicting_pairs"]) == 1
    assert "Direct road status contradiction" in res["conflicting_pairs"][0]["contradiction_type"]
    assert len(res["warnings"]) > 0


def test_contradictory_report_bridge_collapse():
    reports = [
        {"report_id": "REP-10", "description": "Steel bridge is intact and safe for light vehicle traffic."},
        {"report_id": "REP-11", "description": "Chenab bridge collapsed and washed away after flash flood."},
    ]
    res = detect_contradictions(reports)

    assert res["has_contradiction"] is True
    assert "Infrastructure contradiction" in res["conflicting_pairs"][0]["contradiction_type"]


def test_evidence_completeness_assessment():
    high_evidence = assess_evidence_completeness(
        description="Massive rockfall on NH-44 at Cafeteria Morh Ramban blocking both lanes completely.",
        has_image=True,
        has_gps=True,
        has_timestamp=True,
    )
    assert high_evidence["quality_label"] == "high"
    assert high_evidence["completeness_score"] >= 0.80
    assert len(high_evidence["missing_items"]) == 0

    sparse_evidence = assess_evidence_completeness(
        description="help",
        has_image=False,
        has_gps=False,
        has_timestamp=False,
    )
    assert sparse_evidence["quality_label"] == "low"
    assert sparse_evidence["completeness_score"] < 0.40
    assert len(sparse_evidence["missing_items"]) >= 3


# ============================================================================
# 2. Citizen Media & Image Hash Tests
# ============================================================================

def test_image_hashing_exact_duplicate():
    img_bytes = create_synthetic_image(color="green", pattern="stripes")
    hashes1 = compute_image_hashes(img_bytes)
    hashes2 = compute_image_hashes(img_bytes)

    comp = compare_image_hashes(hashes1["phash"], hashes2["phash"])
    assert comp["hamming_distance"] == 0
    assert comp["is_duplicate"] is True
    assert comp["match_category"] == "exact_duplicate"


def test_image_hashing_near_duplicate():
    img1 = create_synthetic_image(color="white", pattern="rectangle")
    # Compress with lossy JPEG to simulate messaging app re-compression
    pil_img = Image.open(io.BytesIO(img1))
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=65)
    img2 = buf.getvalue()

    hashes1 = compute_image_hashes(img1)
    hashes2 = compute_image_hashes(img2)

    comp = compare_image_hashes(hashes1["phash"], hashes2["phash"])
    assert comp["hamming_distance"] <= 5
    assert comp["is_duplicate"] is True


def test_image_hashing_distinct_images():
    img1 = create_synthetic_image(color="white", pattern="rectangle")
    img2 = create_synthetic_image(color="blue", pattern="ellipse")

    hashes1 = compute_image_hashes(img1)
    hashes2 = compute_image_hashes(img2)

    comp = compare_image_hashes(hashes1["phash"], hashes2["phash"])
    assert comp["hamming_distance"] > 10
    assert comp["is_duplicate"] is False
    assert comp["match_category"] == "distinct"


def test_detect_duplicate_images_in_catalog():
    target_img = create_synthetic_image(color="yellow", pattern="cross")
    target_hash = compute_image_hashes(target_img)["phash"]

    catalog = [
        {"evidence_id": "EV-001", "incident_id": "INC-01", "phash": target_hash},
        {"evidence_id": "EV-002", "incident_id": "INC-02", "phash": "0000000000000000"},
    ]

    res = detect_duplicate_images(target_hash, catalog)
    assert res["is_duplicate_found"] is True
    assert res["duplicate_count"] == 1
    assert res["matches"][0]["evidence_id"] == "EV-001"
    # Verify AI safety principle
    assert "Duplicate images do not prove an incident is fake" in res["safety_principle"]


def test_metadata_extraction_missing_exif_safety():
    img_bytes = create_synthetic_image(color="white", pattern="stripes")
    meta = extract_image_metadata(img_bytes)

    assert meta["exif_available"] is False
    assert meta["sha256"] is not None
    assert len(meta["sha256"]) == 64
    # Safety principle check: missing EXIF is explained, not marked fraud
    assert any("No EXIF metadata present" in w for w in meta["warnings"])
    assert "Missing EXIF or GPS does not prove fraud" in meta["safety_disclaimer"]


# ============================================================================
# 3. Temporal Consistency & Staleness Tests
# ============================================================================

def test_temporal_fresh_capture():
    now = datetime.now(timezone.utc)
    res = check_temporal_consistency(
        reported_at=now,
        evidence_captured_at=now - timedelta(hours=2),
        current_time=now,
    )
    assert res["is_consistent"] is True
    assert res["is_stale"] is False
    assert res["staleness_level"] == "recent"


def test_temporal_moderately_stale():
    now = datetime.now(timezone.utc)
    res = check_temporal_consistency(
        reported_at=now,
        evidence_captured_at=now - timedelta(days=12),
        current_time=now,
    )
    assert res["is_stale"] is True
    assert res["staleness_level"] == "moderately_stale"
    assert any(">7 days" in w for w in res["warnings"])


def test_temporal_severely_stale():
    now = datetime.now(timezone.utc)
    res = check_temporal_consistency(
        reported_at=now,
        evidence_captured_at=now - timedelta(days=45),
        current_time=now,
    )
    assert res["is_stale"] is True
    assert res["is_consistent"] is False
    assert res["staleness_level"] == "stale"
    assert any(">30 days" in w for w in res["warnings"])


def test_temporal_future_timestamp_rejected():
    now = datetime.now(timezone.utc)
    res = check_temporal_consistency(
        reported_at=now + timedelta(hours=3),
        evidence_captured_at=now,
        current_time=now,
    )
    assert res["is_consistent"] is False
    assert any("in the future" in w for w in res["warnings"])


# ============================================================================
# 4. Location & Haversine Distance Tests
# ============================================================================

def test_haversine_distance_accurate():
    # Ramban to Banihal ~ 25 to 30 km straight line
    lat_ramban, lng_ramban = 33.245, 75.240
    lat_banihal, lng_banihal = 33.480, 75.200
    dist = haversine_distance_km(lat_ramban, lng_ramban, lat_banihal, lng_banihal)
    assert 25.0 < dist < 35.0


def test_gps_mismatch_detection():
    rep_lat, rep_lng = 33.245, 75.240
    # Evidence taken 1.5 km away (acceptable)
    close_res = check_gps_mismatch(rep_lat, rep_lng, 33.250, 75.245, threshold_km=5.0)
    assert close_res["is_consistent"] is True
    assert close_res["status"] == "consistent"

    # Evidence taken 45 km away (mismatch)
    far_res = check_gps_mismatch(rep_lat, rep_lng, 33.600, 75.500, threshold_km=5.0)
    assert far_res["is_consistent"] is False
    assert far_res["status"] == "mismatch"
    assert "GPS mismatch detected" in far_res["warning"]


def test_gps_missing_handling():
    res = check_gps_mismatch(33.245, 75.240, None, None)
    assert res["has_gps"] is False
    assert res["is_consistent"] is True
    assert res["status"] == "missing_gps"


def test_within_jk_region():
    # Srinagar
    assert is_within_jk_region(34.08, 74.80) is True
    # Ramban
    assert is_within_jk_region(33.24, 75.24) is True
    # New Delhi (outside JK)
    assert is_within_jk_region(28.61, 77.20) is False


# ============================================================================
# 5. Satellite Evidence Correlation Tests
# ============================================================================

def test_satellite_supporting_observation_available():
    provider = MockSatelliteProvider()
    now = datetime.now(timezone.utc)
    # Incident in Ramban area matching the simulated Sentinel-1 radar pass
    res = correlate_satellite_evidence(
        incident_lat=33.245,
        incident_lng=75.240,
        incident_time=now - timedelta(hours=6),
        provider=provider,
        incident_type="landslide",
    )

    assert res.status == ObservationStatus.SUPPORTING_OBSERVATION_AVAILABLE
    assert res.relevance_score >= 0.70
    assert res.best_observation is not None
    assert res.best_observation.platform == SatellitePlatform.SENTINEL_1
    assert res.data_provenance == DataProvenance.SIMULATED
    assert res.human_review_required is True


def test_satellite_conflicting_observation():
    provider = MockSatelliteProvider()
    now = datetime.now(timezone.utc)
    # Incident reported in Batote where SAR showed stable slope
    res = correlate_satellite_evidence(
        incident_lat=33.160,
        incident_lng=75.320,
        incident_time=now - timedelta(hours=3),
        provider=provider,
        incident_type="landslide",
    )

    assert res.status == ObservationStatus.CONFLICTING_OBSERVATION_DETECTED
    assert any("Conflicting satellite data" in w for w in res.warnings)
    assert res.human_review_required is True


def test_satellite_no_relevant_observation():
    provider = MockSatelliteProvider()
    now = datetime.now(timezone.utc)
    # Distant coordinates with no coverage
    res = correlate_satellite_evidence(
        incident_lat=35.500,
        incident_lng=78.500,
        incident_time=now,
        provider=provider,
    )

    assert res.status == ObservationStatus.NO_RELEVANT_OBSERVATION_AVAILABLE
    assert res.best_observation is None
    assert res.relevance_score == 0.0


def test_satellite_insufficient_quality_cloudy():
    provider = MockSatelliteProvider()
    now = datetime.now(timezone.utc)
    # Chenab basin coordinates where Sentinel-2 has 82% cloud coverage
    res = correlate_satellite_evidence(
        incident_lat=33.200,
        incident_lng=75.650,
        incident_time=now - timedelta(hours=8),
        provider=provider,
    )

    assert res.status == ObservationStatus.INSUFFICIENT_COVERAGE_OR_QUALITY
    assert any("cloud cover" in w.lower() for w in res.warnings)
    assert res.human_review_required is True


def test_proactive_satellite_monitoring_alerts():
    provider = MockSatelliteProvider()
    alerts = provider.get_proactive_alerts()

    assert len(alerts) >= 2
    for alert in alerts:
        assert alert.data_provenance == DataProvenance.SIMULATED
        assert alert.alert_id.startswith("ALERT-SIM-")
        assert alert.severity in ("high", "medium", "low")


# ============================================================================
# 6. End-to-End AAPDA Lens Service Integration Tests
# ============================================================================

def test_analyze_incident_full_pipeline_corroborated():
    now = datetime.now(timezone.utc)
    img_bytes = create_synthetic_image("brown", "stripes")

    report = {
        "report_id": "REP-JK-001",
        "title": "Severe Landslide at Panthyal NH-44",
        "description": "Massive landslide blocking NH-44 near Panthyal Ramban. Debris and large boulders across both lanes.",
        "lat": 33.245,
        "lng": 75.240,
        "type": "landslide",
        "district": "Ramban",
        "created_at": now - timedelta(hours=5),
        "claimed_capture_time": now - timedelta(hours=5, minutes=15),
        "evidence_lat": 33.246,
        "evidence_lng": 75.241,
        "image_bytes": img_bytes,
    }

    env_context = {
        "rainfall_mm_per_hour": 34.5,
        "weather_condition": "torrential_rain",
    }

    output = analyze_incident(
        reports=report,
        environmental_context=env_context,
    )

    assert output.requires_human_review is True
    assert output.confidence_score >= 0.70
    assert output.assessment_status == "corroborated"
    assert "citizen_reports" in output.evidence_sources
    assert "citizen_photographs" in output.evidence_sources
    assert "satellite_simulated" in output.evidence_sources
    assert "environmental_weather_station" in output.evidence_sources
    assert output.location_consistency["is_within_disaster_zone"] is True
    assert output.temporal_consistency["is_consistent"] is True


def test_analyze_incident_unverified_sparse():
    now = datetime.now(timezone.utc)
    report = {
        "report_id": "REP-SPARSE-002",
        "title": "Trouble",
        "description": "water on road",
        "lat": 33.400,
        "lng": 75.800,
        "created_at": now,
    }

    output = analyze_incident(reports=report)

    assert output.requires_human_review is True
    assert output.assessment_status in ("needs_field_dispatch", "unverified")
    assert output.confidence_score <= 0.50
    assert output.evidence_quality["quality_label"] == "low"
