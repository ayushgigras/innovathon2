import networkx as nx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.road import RoadSegment
from app.schemas.road import RouteOption, AlternativeRoutesResponse


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
                route_id="ALT-MUGHAL-01",
                name="Alternate via Mughal Road (Shopian - Bafliaz - Rajouri)",
                distance_km=142.5,
                estimated_time_minutes=290,
                status="passable_light_vehicles",
                passable=True,
                segments=["Mughal Road Sector 1", "Pir Ki Gali Pass", "Bafliaz Link"],
            )
        )
        alternatives.append(
            RouteOption(
                route_id="ALT-BATOTE-02",
                name="Secondary Link via Batote - Kishtwar road",
                distance_km=168.0,
                estimated_time_minutes=340,
                status="partially_open",
                passable=True,
                segments=["NH-244 Chenab Corridor", "Kishtwar-Sinthan Access"],
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
