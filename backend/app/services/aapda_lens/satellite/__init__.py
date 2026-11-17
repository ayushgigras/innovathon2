"""
Satellite Evidence Subpackage for AAPDA Lens.
Exports models, providers, and spatiotemporal correlation functions.
"""

from app.services.aapda_lens.satellite.models import (
    DataProvenance,
    SatellitePlatform,
    SensorType,
    ObservationStatus,
    SatelliteObservation,
    ProactiveSatelliteAlert,
    SatelliteCorrelationResult,
)
from app.services.aapda_lens.satellite.base import BaseSatelliteProvider
from app.services.aapda_lens.satellite.mock_provider import MockSatelliteProvider
from app.services.aapda_lens.satellite.copernicus_live_provider import CopernicusLiveProvider
from app.services.aapda_lens.satellite.provider import (
    get_satellite_provider,
    set_satellite_provider,
)
from app.services.aapda_lens.satellite.correlation import (
    correlate_satellite_evidence,
)

__all__ = [
    "DataProvenance",
    "SatellitePlatform",
    "SensorType",
    "ObservationStatus",
    "SatelliteObservation",
    "ProactiveSatelliteAlert",
    "SatelliteCorrelationResult",
    "BaseSatelliteProvider",
    "MockSatelliteProvider",
    "CopernicusLiveProvider",
    "get_satellite_provider",
    "set_satellite_provider",
    "correlate_satellite_evidence",
]
