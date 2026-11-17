"""
Base Abstract Provider Interface for Satellite Evidence in AAPDA Lens.
Enables pluggable integration of real providers (Copernicus, NASA) or simulated mocks.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from app.services.aapda_lens.satellite.models import SatelliteObservation, ProactiveSatelliteAlert


class BaseSatelliteProvider(ABC):
    """
    Abstract contract for querying satellite observations and automated proactive alerts.
    """

    @abstractmethod
    def lookup_observations(
        self,
        lat: float,
        lng: float,
        timestamp: datetime,
        window_hours: float = 48.0,
        max_radius_km: float = 30.0,
    ) -> List[SatelliteObservation]:
        """
        Query satellite observations within a spatial radius and temporal window around an incident.
        Must return an empty list if no coverage exists (never fabricate data).
        """
        pass

    @abstractmethod
    def get_proactive_alerts(
        self,
        region_id: Optional[str] = None,
    ) -> List[ProactiveSatelliteAlert]:
        """
        Retrieve proactive monitoring alerts for vulnerable mountainous corridors.
        """
        pass
