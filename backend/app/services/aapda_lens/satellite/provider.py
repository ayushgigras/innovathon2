"""
Satellite Provider Factory & Service Locator for AAPDA Lens.
Manages active satellite provider instance.
"""

from typing import Optional
from app.services.aapda_lens.satellite.base import BaseSatelliteProvider
from app.services.aapda_lens.satellite.mock_provider import MockSatelliteProvider


_global_provider: Optional[BaseSatelliteProvider] = None


def get_satellite_provider() -> BaseSatelliteProvider:
    """Returns the configured satellite provider singleton (defaults to MockSatelliteProvider)."""
    global _global_provider
    if _global_provider is None:
        _global_provider = MockSatelliteProvider()
    return _global_provider


def set_satellite_provider(provider: BaseSatelliteProvider):
    """Overrides the global provider (useful for testing or switching between mock and real API)."""
    global _global_provider
    _global_provider = provider
