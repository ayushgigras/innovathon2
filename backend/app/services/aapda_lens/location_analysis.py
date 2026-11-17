"""
Location & Spatial Analysis Module for AAPDA Lens.
Provides spherical distance (Haversine), proximity scoring, and GPS mismatch checks.
"""

import math
from typing import Dict, Any, Optional, Tuple, List


EARTH_RADIUS_KM = 6371.0

# Approximate bounding box for Jammu, Kashmir & Ladakh disaster monitoring zone
JK_BOUNDING_BOX = {
    "min_lat": 32.0,
    "max_lat": 37.5,
    "min_lng": 73.0,
    "max_lng": 80.5,
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth in kilometers.
    """
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


def is_within_bounding_box(
    lat: float,
    lng: float,
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> bool:
    """Checks whether a coordinate lies within a geographic bounding box."""
    return (min_lat <= lat <= max_lat) and (min_lng <= lng <= max_lng)


def is_within_jk_region(lat: float, lng: float) -> bool:
    """Checks if coordinates fall within the J&K operational disaster zone."""
    return is_within_bounding_box(
        lat, lng,
        JK_BOUNDING_BOX["min_lat"],
        JK_BOUNDING_BOX["min_lng"],
        JK_BOUNDING_BOX["max_lat"],
        JK_BOUNDING_BOX["max_lng"],
    )


def check_gps_mismatch(
    reported_lat: float,
    reported_lng: float,
    evidence_lat: Optional[float],
    evidence_lng: Optional[float],
    threshold_km: float = 5.0,
) -> Dict[str, Any]:
    """
    Evaluates consistency between the reported incident coordinates and coordinates
    extracted from evidence (e.g., photo EXIF metadata or GPS attachment).
    
    Safety principle: Missing GPS does not prove fraud.
    """
    if evidence_lat is None or evidence_lng is None:
        return {
            "has_gps": False,
            "distance_km": None,
            "is_consistent": True,  # Cannot establish mismatch if no GPS is provided
            "warning": "No GPS metadata present in evidence; requires manual location check.",
            "status": "missing_gps",
        }

    # Validate coordinate bounds
    if not (-90.0 <= evidence_lat <= 90.0 and -180.0 <= evidence_lng <= 180.0):
        return {
            "has_gps": True,
            "distance_km": None,
            "is_consistent": False,
            "warning": "Evidence GPS coordinates out of valid planetary bounds.",
            "status": "invalid_coordinates",
        }

    distance = haversine_distance_km(reported_lat, reported_lng, evidence_lat, evidence_lng)

    if distance <= threshold_km:
        return {
            "has_gps": True,
            "distance_km": round(distance, 2),
            "is_consistent": True,
            "warning": None,
            "status": "consistent",
        }
    else:
        return {
            "has_gps": True,
            "distance_km": round(distance, 2),
            "is_consistent": False,
            "warning": (
                f"GPS mismatch detected: Evidence location is {distance:.1f} km away from reported "
                f"incident site (threshold: {threshold_km} km). Verify if photographer took image from vantage point."
            ),
            "status": "mismatch",
        }
