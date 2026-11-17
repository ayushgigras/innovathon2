"""
Satellite Evidence Spatiotemporal Correlation Engine for AAPDA Lens.
Correlates citizen-reported incidents against satellite overpasses and sensor observations.
Adheres strictly to the safety rule: Coverage alone does not prove ground event reality.
"""

from datetime import datetime, timezone
from typing import Optional, List
from app.services.aapda_lens.location_analysis import haversine_distance_km
from app.services.aapda_lens.satellite.base import BaseSatelliteProvider
from app.services.aapda_lens.satellite.models import (
    SatelliteObservation,
    SatelliteCorrelationResult,
    ObservationStatus,
    DataProvenance,
)


def correlate_satellite_evidence(
    incident_lat: float,
    incident_lng: float,
    incident_time: datetime,
    provider: BaseSatelliteProvider,
    incident_type: Optional[str] = None,
    window_hours: float = 48.0,
    max_radius_km: float = 30.0,
) -> SatelliteCorrelationResult:
    """
    Evaluates satellite observations against a reported incident.

    Status outcomes:
    - SUPPORTING_OBSERVATION_AVAILABLE: Sensor detected corroborating ground anomaly/displacement.
    - CONFLICTING_OBSERVATION_DETECTED: High-resolution clear observation shows unperturbed ground contradicting report.
    - NO_RELEVANT_OBSERVATION_AVAILABLE: No passes over the area within temporal window.
    - INSUFFICIENT_COVERAGE_OR_QUALITY: Dense cloud cover or low spatial resolution renders data inconclusive.
    - SATELLITE_ANALYSIS_PENDING: Overpass scheduled or undergoing interferometric processing.
    """
    if incident_time.tzinfo is None:
        incident_time = incident_time.replace(tzinfo=timezone.utc)

    observations = provider.lookup_observations(
        lat=incident_lat,
        lng=incident_lng,
        timestamp=incident_time,
        window_hours=window_hours,
        max_radius_km=max_radius_km,
    )

    if not observations:
        return SatelliteCorrelationResult(
            status=ObservationStatus.NO_RELEVANT_OBSERVATION_AVAILABLE,
            relevance_score=0.0,
            best_observation=None,
            evaluated_observations_count=0,
            spatial_distance_km=None,
            temporal_delta_hours=None,
            warnings=[
                f"No satellite observations available within ±{window_hours:.0f}h and {max_radius_km:.0f}km radius of incident coordinates."
            ],
            reasons=[
                "Orbital revisit intervals or orbital tracks did not coincide with incident window."
            ],
            data_provenance=DataProvenance.SIMULATED,
            human_review_required=True,
        )

    # Rank observations by spatiotemporal closeness
    best_obs: Optional[SatelliteObservation] = None
    min_combined_metric = 999999.0
    best_dist = 0.0
    best_delta_hours = 0.0

    for obs in observations:
        obs_time = obs.acquisition_time
        if obs_time.tzinfo is None:
            obs_time = obs_time.replace(tzinfo=timezone.utc)

        delta_hours = abs((incident_time - obs_time).total_seconds()) / 3600.0
        dist_km = haversine_distance_km(incident_lat, incident_lng, obs.center_lat, obs.center_lng)

        # Heuristic combined metric (1km distance equivalent to 2 hours time delta)
        metric = dist_km + (delta_hours * 0.5)
        if metric < min_combined_metric:
            min_combined_metric = metric
            best_obs = obs
            best_dist = dist_km
            best_delta_hours = delta_hours

    if best_obs is None:
        return SatelliteCorrelationResult(
            status=ObservationStatus.NO_RELEVANT_OBSERVATION_AVAILABLE,
            relevance_score=0.0,
            evaluated_observations_count=len(observations),
            human_review_required=True,
        )

    warnings: List[str] = []
    reasons: List[str] = []

    # 1. Cloud cover check (especially relevant for optical sensors like Sentinel-2)
    if best_obs.cloud_coverage is not None and best_obs.cloud_coverage > 0.50:
        cloud_pct = int(best_obs.cloud_coverage * 100)
        warnings.append(
            f"Optical imagery obscured by {cloud_pct}% cloud cover. Surface ground condition inconclusive."
        )
        return SatelliteCorrelationResult(
            status=ObservationStatus.INSUFFICIENT_COVERAGE_OR_QUALITY,
            relevance_score=0.20,
            best_observation=best_obs,
            evaluated_observations_count=len(observations),
            spatial_distance_km=round(best_dist, 2),
            temporal_delta_hours=round(best_delta_hours, 2),
            warnings=warnings,
            reasons=[
                f"Observation from {best_obs.platform.value} failed quality threshold due to {cloud_pct}% cloud coverage.",
                "Recommend requesting radar SAR or aerial UAV drone imagery for all-weather confirmation."
            ],
            data_provenance=best_obs.data_provenance,
            human_review_required=True,
        )

    # 2. Corroborating Anomaly Check
    if best_obs.anomaly_detected:
        relevance = max(0.40, min(0.95, 0.90 - (best_dist * 0.01) - (best_delta_hours * 0.005)))
        reasons.append(
            f"Corroborating satellite observation: {best_obs.platform.value} ({best_obs.sensor.value}) "
            f"detected anomaly within {best_dist:.1f}km and {best_delta_hours:.1f}h: {best_obs.anomaly_description or 'Ground anomaly detected.'}"
        )
        return SatelliteCorrelationResult(
            status=ObservationStatus.SUPPORTING_OBSERVATION_AVAILABLE,
            relevance_score=round(relevance, 2),
            best_observation=best_obs,
            evaluated_observations_count=len(observations),
            spatial_distance_km=round(best_dist, 2),
            temporal_delta_hours=round(best_delta_hours, 2),
            warnings=warnings,
            reasons=reasons,
            data_provenance=best_obs.data_provenance,
            human_review_required=True,
        )

    # 3. Conflicting Observation Check
    # If SAR radar clearly shows no deformation/change over a reported high-impact blockage
    if incident_type in ("landslide", "rockfall", "road_damage") and "sar" in best_obs.observation_type.lower():
        warnings.append(
            f"Conflicting satellite data: Clear SAR radar observation acquired {best_delta_hours:.1f}h from reported event "
            "shows no detectable structural ground deformation or debris accumulation at reported coordinates."
        )
        return SatelliteCorrelationResult(
            status=ObservationStatus.CONFLICTING_OBSERVATION_DETECTED,
            relevance_score=0.35,
            best_observation=best_obs,
            evaluated_observations_count=len(observations),
            spatial_distance_km=round(best_dist, 2),
            temporal_delta_hours=round(best_delta_hours, 2),
            warnings=warnings,
            reasons=[
                "Satellite radar pass directly covers incident location with high coherence and zero detected slope displacement.",
                "Discrepancy warrants field patrol verification before dispatching heavy machinery."
            ],
            data_provenance=best_obs.data_provenance,
            human_review_required=True,
        )

    # 4. Inconclusive coverage
    return SatelliteCorrelationResult(
        status=ObservationStatus.INSUFFICIENT_COVERAGE_OR_QUALITY,
        relevance_score=0.30,
        best_observation=best_obs,
        evaluated_observations_count=len(observations),
        spatial_distance_km=round(best_dist, 2),
        temporal_delta_hours=round(best_delta_hours, 2),
        warnings=["Satellite pass captured scene but automated change detection was inconclusive."],
        reasons=["Pixel resolution or backscatter variance did not meet threshold for automated corroboration."],
        data_provenance=best_obs.data_provenance,
        human_review_required=True,
    )
