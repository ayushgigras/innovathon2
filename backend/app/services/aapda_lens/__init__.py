"""
AAPDA Lens — Multi-Source Evidence Intelligence and Incident Verification Service.
Evaluates Citizen Reports, Satellite Overpasses, and Environmental Context.
"""

from app.services.aapda_lens.deduplication import (
    analyze_incident_verification,
    haversine_distance_km as deduplication_haversine,
)
from app.services.aapda_lens.location_analysis import (
    haversine_distance_km,
    check_gps_mismatch,
    is_within_jk_region,
)
from app.services.aapda_lens.temporal_analysis import (
    parse_utc_timestamp,
    check_temporal_consistency,
)
from app.services.aapda_lens.metadata_analysis import (
    extract_image_metadata,
    calculate_sha256,
)
from app.services.aapda_lens.image_analysis import (
    compute_image_hashes,
    compare_image_hashes,
    detect_duplicate_images,
)
from app.services.aapda_lens.text_analysis import (
    compute_text_similarity,
    extract_disaster_entities,
    detect_contradictions,
    assess_evidence_completeness,
)
from app.services.aapda_lens.satellite import (
    DataProvenance,
    SatellitePlatform,
    SensorType,
    ObservationStatus,
    SatelliteObservation,
    ProactiveSatelliteAlert,
    SatelliteCorrelationResult,
    BaseSatelliteProvider,
    MockSatelliteProvider,
    get_satellite_provider,
    set_satellite_provider,
    correlate_satellite_evidence,
)
from app.services.aapda_lens.service import (
    analyze_incident,
    LensAnalysisOutput,
)

__all__ = [
    # Main Service Interface
    "analyze_incident",
    "LensAnalysisOutput",
    "analyze_incident_verification",
    # Spatial & Location
    "haversine_distance_km",
    "check_gps_mismatch",
    "is_within_jk_region",
    # Temporal
    "parse_utc_timestamp",
    "check_temporal_consistency",
    # Metadata & Integrity
    "extract_image_metadata",
    "calculate_sha256",
    # Images
    "compute_image_hashes",
    "compare_image_hashes",
    "detect_duplicate_images",
    # Text
    "compute_text_similarity",
    "extract_disaster_entities",
    "detect_contradictions",
    "assess_evidence_completeness",
    # Satellite
    "DataProvenance",
    "SatellitePlatform",
    "SensorType",
    "ObservationStatus",
    "SatelliteObservation",
    "ProactiveSatelliteAlert",
    "SatelliteCorrelationResult",
    "BaseSatelliteProvider",
    "MockSatelliteProvider",
    "get_satellite_provider",
    "set_satellite_provider",
    "correlate_satellite_evidence",
]
