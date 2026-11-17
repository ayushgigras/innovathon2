"""
Simulated Mock Satellite Provider for AAPDA Lens.
Provides realistic J&K mountain corridor synthetic observations for testing and MVP demonstration.
All data is strictly marked DataProvenance.SIMULATED.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from app.services.aapda_lens.location_analysis import haversine_distance_km
from app.services.aapda_lens.satellite.base import BaseSatelliteProvider
from app.services.aapda_lens.satellite.models import (
    SatelliteObservation,
    ProactiveSatelliteAlert,
    SatellitePlatform,
    SensorType,
    DataProvenance,
)


class MockSatelliteProvider(BaseSatelliteProvider):
    """
    Mock satellite provider simulating Copernicus Sentinel-1 SAR, Sentinel-2 Optical, and NASA FIRMS.
    Used for local testing, offline workflows, and demo scenarios.
    """

    def __init__(self):
        self._observations: List[SatelliteObservation] = []
        self._proactive_alerts: List[ProactiveSatelliteAlert] = []
        self._initialize_synthetic_catalog()

    def _initialize_synthetic_catalog(self):
        now = datetime.now(timezone.utc)

        # 1. Supporting Observation: Sentinel-1 SAR over Ramban / NH-44 (Landslide detection)
        # Radar penetrates clouds and detects ground deformation
        obs_ramban_sar = SatelliteObservation(
            evidence_id="SAT-SIM-RAMBAN-S1-001",
            provider="Copernicus Data Space Ecosystem (Simulated)",
            platform=SatellitePlatform.SENTINEL_1,
            sensor=SensorType.SAR_C_BAND,
            product_identifier="S1A_IW_GRDH_1SDV_20261115T011500_041234_04F8A1",
            acquisition_time=now - timedelta(hours=6),
            processing_time=now - timedelta(hours=4),
            min_lat=33.15,
            max_lat=33.35,
            min_lng=75.10,
            max_lng=75.35,
            center_lat=33.245,
            center_lng=75.240,
            coverage_radius_km=25.0,
            resolution="10m SAR interferometry",
            cloud_coverage=0.0,  # SAR unaffected by cloud cover
            observation_type="sar_interferometry",
            anomaly_detected=True,
            anomaly_description="Ground phase displacement (>18cm) and slope debris accumulation detected along NH-44 corridor.",
            source_reference="SIMULATED://copernicus.eu/s1/ramban-interferogram-202611",
            data_provenance=DataProvenance.SIMULATED,
            advisory_notes="SAR coherence loss strongly corroborates reported mass movement.",
        )

        # 2. Conflicting Observation: Sentinel-1 SAR over Batote corridor
        # Slope shows zero deformation / unchanged backscatter
        obs_batote_stable = SatelliteObservation(
            evidence_id="SAT-SIM-BATOTE-S1-002",
            provider="Copernicus Data Space Ecosystem (Simulated)",
            platform=SatellitePlatform.SENTINEL_1,
            sensor=SensorType.SAR_C_BAND,
            product_identifier="S1B_IW_GRDH_1SDV_20261116T012000_039981_04D1A2",
            acquisition_time=now - timedelta(hours=3),
            processing_time=now - timedelta(hours=1),
            min_lat=33.10,
            max_lat=33.20,
            min_lng=75.25,
            max_lng=75.38,
            center_lat=33.160,
            center_lng=75.320,
            coverage_radius_km=15.0,
            resolution="10m SAR interferometry",
            cloud_coverage=0.0,
            observation_type="sar_interferometry",
            anomaly_detected=False,
            anomaly_description=None,
            source_reference="SIMULATED://copernicus.eu/s1/batote-interferogram-202611",
            data_provenance=DataProvenance.SIMULATED,
            advisory_notes="SAR analysis shows stable slope with no detectable structural displacement or debris blockage.",
        )

        # 3. Insufficient Quality / Cloudy Observation: Sentinel-2 Optical over Chenab Basin
        # 82% cloud coverage obscuring ground imagery
        obs_chenab_cloudy = SatelliteObservation(
            evidence_id="SAT-SIM-CHENAB-S2-003",
            provider="Copernicus Data Space Ecosystem (Simulated)",
            platform=SatellitePlatform.SENTINEL_2,
            sensor=SensorType.OPTICAL_MULTISPECTRAL,
            product_identifier="S2B_MSIL2A_20261116T054500_N0500_R019_T43SFU",
            acquisition_time=now - timedelta(hours=8),
            processing_time=now - timedelta(hours=5),
            min_lat=33.00,
            max_lat=33.40,
            min_lng=75.40,
            max_lng=75.90,
            center_lat=33.200,
            center_lng=75.650,
            coverage_radius_km=35.0,
            resolution="10m Optical",
            cloud_coverage=0.82,  # >50% obscured
            observation_type="optical_surface_change",
            anomaly_detected=False,
            anomaly_description="Ground visibility severely compromised by dense cloud cover over Pir Panjal range.",
            source_reference="SIMULATED://copernicus.eu/s2/chenab-cloudy-202611",
            data_provenance=DataProvenance.SIMULATED,
            advisory_notes="Optical imagery unserviceable due to heavy cloud coverage; defer to radar/SAR.",
        )

        self._observations = [obs_ramban_sar, obs_batote_stable, obs_chenab_cloudy]

        # Predefined proactive alerts
        alert_ramban = ProactiveSatelliteAlert(
            alert_id="ALERT-SIM-RAMBAN-2026-01",
            region_id="REG-RAMBAN-NH44",
            region_name="Ramban - Panthyal Mountain Corridor (NH-44)",
            anomaly_type="rapid_slope_displacement",
            detected_at=now - timedelta(hours=5),
            lat=33.242,
            lng=75.238,
            estimated_radius_km=3.5,
            severity="high",
            description="Automated SAR interferometry pipeline flagged acceleration in slope displacement (>22mm/day) above Panthyal sector.",
            data_provenance=DataProvenance.SIMULATED,
        )

        alert_chenab = ProactiveSatelliteAlert(
            alert_id="ALERT-SIM-CHENAB-2026-02",
            region_id="REG-CHENAB-DODA",
            region_name="Chenab Gorge / Pul Doda Sector",
            anomaly_type="river_surface_widening",
            detected_at=now - timedelta(hours=12),
            lat=33.145,
            lng=75.540,
            estimated_radius_km=5.0,
            severity="medium",
            description="Optical-radar composite detected 40% expansion in river channel width following intense catchment precipitation.",
            data_provenance=DataProvenance.SIMULATED,
        )

        self._proactive_alerts = [alert_ramban, alert_chenab]

    def add_custom_observation(self, observation: SatelliteObservation):
        """Allows injecting specific test observations into the provider catalog."""
        self._observations.append(observation)

    def lookup_observations(
        self,
        lat: float,
        lng: float,
        timestamp: datetime,
        window_hours: float = 48.0,
        max_radius_km: float = 30.0,
    ) -> List[SatelliteObservation]:
        """
        Filters observations matching spatial distance and temporal observation window.
        Returns empty list if no satellite pass covered the coordinate within window.
        """
        results: List[SatelliteObservation] = []
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)

        for obs in self._observations:
            obs_time = obs.acquisition_time
            if obs_time.tzinfo is None:
                obs_time = obs_time.replace(tzinfo=timezone.utc)

            time_diff = abs((timestamp - obs_time).total_seconds()) / 3600.0
            if time_diff > window_hours:
                continue

            # Check distance to observation center
            dist = haversine_distance_km(lat, lng, obs.center_lat, obs.center_lng)
            if dist <= max(max_radius_km, obs.coverage_radius_km):
                results.append(obs)

        return results

    def get_proactive_alerts(
        self,
        region_id: Optional[str] = None,
    ) -> List[ProactiveSatelliteAlert]:
        if region_id:
            return [a for a in self._proactive_alerts if a.region_id == region_id]
        return list(self._proactive_alerts)
