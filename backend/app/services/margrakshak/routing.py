import networkx as nx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.road import RoadSegment
from app.schemas.road import RouteOption, AlternativeRoutesResponse
from app.schemas.common import GeoPoint


def build_road_network(roads: List[RoadSegment]) -> nx.Graph:
    """Builds a NetworkX weighted graph representation of the mountain road system."""
    G = nx.Graph()

    for road in roads:
        # Define endpoint node keys
        u = f"{road.district}:{road.lat_start:.2f},{road.lng_start:.2f}"
        v = f"{road.district}:{road.lat_end:.2f},{road.lng_end:.2f}"

        # Penalty weight based on road status
        weight = 10.0  # base nominal distance km
        is_passable = road.status in ["open", "partially_open"]
        if road.status == "partially_open":
            weight *= 2.5  # delay multiplier for single lane
        elif road.status == "closed":
            weight = 9999.0  # blocked

        G.add_edge(
            u,
            v,
            road_id=road.id,
            name=road.name,
            status=road.status,
            weight=weight,
            passable=is_passable,
        )

    return G


def find_alternative_routes(
    roads: List[RoadSegment],
    origin: str,
    destination: str,
    blocked_road_id: Optional[str] = None,
) -> AlternativeRoutesResponse:
    """
    Finds alternate routes between mountain sectors, especially when primary corridors are blocked.
    """
    # Sample realistic mountain highway alternatives for Jammu & Kashmir
    # (e.g. NH-44 via Banihal vs Mughal Road via Shopian-Bafliaz or Sinthan Top)
    alternatives: List[RouteOption] = []

    if "ramban" in origin.lower() or "nh-44" in (blocked_road_id or "").lower() or (blocked_road_id == "RD-001"):
        alternatives.append(
            RouteOption(
                route_id="ALT-PANTHYAL-01",
                name="Recommended Bypass: Chanderkote - Rajgarh Ridge - Ramsu",
                distance_km=28.4,
                estimated_time_minutes=75,
                status="recommended",
                passable=True,
                segments=["Chanderkote Link Road", "Rajgarh Mountain Spine", "Khari North Detour", "Ramsu Junction"],
                geometry=[
                    GeoPoint(lat=33.22, lng=75.24),
                    GeoPoint(lat=33.228, lng=75.265),
                    GeoPoint(lat=33.245, lng=75.285),
                    GeoPoint(lat=33.265, lng=75.295),
                    GeoPoint(lat=33.285, lng=75.275),
                    GeoPoint(lat=33.315, lng=75.245),
                    GeoPoint(lat=33.345, lng=75.215),
                ],
                warnings=["Narrow mountain road; speed limit 25 km/h", "Cleared for 4x4 relief trucks only"],
                reason="Bypasses the NH-44 Panthyal landslide completely; restores road access to isolated Khari Village.",
            )
        )
        alternatives.append(
            RouteOption(
                route_id="ALT-KISHTWAR-02",
                name="Secondary Alternate: Batote - Kishtwar - Sinthan Pass",
                distance_km=146.0,
                estimated_time_minutes=285,
                status="alternative",
                passable=True,
                segments=["NH-244 Chenab Corridor", "Kishtwar Outer Ring", "Sinthan Top Pass (3750m)"],
                geometry=[
                    GeoPoint(lat=33.21, lng=75.26),
                    GeoPoint(lat=33.18, lng=75.38),
                    GeoPoint(lat=33.148, lng=75.546),
                    GeoPoint(lat=33.23, lng=75.68),
                    GeoPoint(lat=33.313, lng=75.771),
                    GeoPoint(lat=33.45, lng=75.55),
                    GeoPoint(lat=33.52, lng=75.20),
                ],
                warnings=["High altitude pass (3,750m); icy patches near summit", "Long transit time (+4.7 hours)"],
                reason="Heavy convoy alternate for heavy multi-axle supply trucks unable to negotiate narrow ridge roads.",
            )
        )
    else:
        # Generic fallback route
        alternatives.append(
            RouteOption(
                route_id="ALT-GENERIC-01",
                name=f"Bypass via Secondary Sector Connector ({origin} to {destination})",
                distance_km=85.0,
                estimated_time_minutes=180,
                status="open",
                passable=True,
                segments=[f"{origin} Outer Ring", "PWD Link Road", f"{destination} Approach"],
            )
        )

    return AlternativeRoutesResponse(
        origin=origin,
        destination=destination,
        blocked_road_id=blocked_road_id,
        direct_route_available=False if blocked_road_id else True,
        alternate_routes=alternatives,
        generated_at=datetime.now(timezone.utc),
    )
