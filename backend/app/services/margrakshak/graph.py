"""
MargRakshak Road Network Graph Engine.
Uses NetworkX to model mountain road networks, settlements, junctions, and critical facilities.
Calculates deterministic traversal weights and preserves road status update histories.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
import networkx as nx


def _get_attr(obj: Any, key: str, default: Any = None) -> Any:
    """Helper to safely extract attribute or dict key."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def build_road_graph(
    road_segments: List[Any],
    settlements: Optional[List[Any]] = None,
    facilities: Optional[List[Any]] = None,
) -> nx.Graph:
    """
    Constructs a weighted NetworkX graph representing the mountain road network.
    
    Nodes:
    - Settlements (e.g., 'SET-001', 'Khari Village')
    - Road junctions / endpoints
    - Critical facilities (hospitals, relief warehouses)
    
    Edges:
    - Roads connecting locations with distance, travel time, and accessibility status.
    
    Penalty weights:
    - open: 1.0x (standard traversal)
    - partially_accessible / partially_open: 2.5x (single lane / convoy delays)
    - unknown: 2.0x (cautious handling; never assume unknown is clear)
    - closed: 999999.0 (impassable; excluded from traversal)
    """
    G = nx.Graph()

    # 1. Add Facilities as nodes
    if facilities:
        for fac in facilities:
            fac_id = str(_get_attr(fac, "id", "FAC-UNKNOWN"))
            name = _get_attr(fac, "name", fac_id)
            fac_type = _get_attr(fac, "type", "hospital")
            G.add_node(
                fac_id,
                node_type="facility",
                facility_type=fac_type,
                name=name,
                lat=_get_attr(fac, "lat", 0.0),
                lng=_get_attr(fac, "lng", 0.0),
            )

    # 2. Add Settlements as nodes
    if settlements:
        for s in settlements:
            s_id = str(_get_attr(s, "id", "SET-UNKNOWN"))
            name = _get_attr(s, "name", s_id)
            pop = _get_attr(s, "population", 0)
            G.add_node(
                s_id,
                node_type="settlement",
                name=name,
                population=pop,
                lat=_get_attr(s, "lat", 0.0),
                lng=_get_attr(s, "lng", 0.0),
            )

    # 3. Add Road Segments as edges
    for road in road_segments:
        r_id = str(_get_attr(road, "id", "RD-UNKNOWN"))
        name = _get_attr(road, "name", r_id)
        raw_status = str(_get_attr(road, "status", "open")).lower()

        # Normalize status
        if raw_status in ("closed", "blocked"):
            status = "closed"
            is_passable = False
            penalty = 999999.0
        elif raw_status in ("partially_open", "partially_accessible", "partial"):
            status = "partially_accessible"
            is_passable = True
            penalty = 2.5
        elif raw_status in ("unknown", "unverified"):
            status = "unknown"
            is_passable = True
            penalty = 2.0  # Cautious penalty: never assume unknown is fully open
        else:
            status = "open"
            is_passable = True
            penalty = 1.0

        # Define endpoint nodes
        u = _get_attr(road, "source_node") or _get_attr(road, "lat_start")
        v = _get_attr(road, "destination_node") or _get_attr(road, "lat_end")

        if u is None or v is None:
            # Fallback to coordinate identifier
            lat_s = _get_attr(road, "lat_start", 33.24)
            lng_s = _get_attr(road, "lng_start", 75.24)
            lat_e = _get_attr(road, "lat_end", 33.26)
            lng_e = _get_attr(road, "lng_end", 75.26)
            u = f"JCT:{lat_s:.3f},{lng_s:.3f}"
            v = f"JCT:{lat_e:.3f},{lng_e:.3f}"
        else:
            u = str(u)
            v = str(v)

        dist_km = float(_get_attr(road, "distance_km", 15.0) or 15.0)
        est_mins = int(_get_attr(road, "estimated_time_minutes", int(dist_km * 2.5)) or int(dist_km * 2.5))
        effective_weight = dist_km * penalty

        hazard_info = _get_attr(road, "closure_reason") or _get_attr(road, "hazard_info")
        last_updated = _get_attr(road, "updated_at") or _get_attr(road, "affected_from") or datetime.now(timezone.utc)
        source = _get_attr(road, "source", "field_inspection")

        # Connect settlements to road network if referenced
        aff_settlements = _get_attr(road, "affected_settlements") or []
        for s_ref in aff_settlements:
            if s_ref in G:
                # Link settlement to road junction with zero-weight spur
                G.add_edge(s_ref, u, road_id=f"SPUR-{s_ref}", weight=0.1, distance_km=0.5, passable=True, status="open")

        G.add_edge(
            u,
            v,
            road_id=r_id,
            name=name,
            status=status,
            distance_km=round(dist_km, 2),
            estimated_time_minutes=est_mins,
            weight=effective_weight,
            passable=is_passable,
            hazard_info=hazard_info,
            last_updated=str(last_updated),
            source=source,
            update_history=[{
                "status": status,
                "timestamp": str(last_updated),
                "source": source,
                "reason": hazard_info,
            }],
        )

    return G


def update_road_status(
    graph: nx.Graph,
    road_id: str,
    new_status: str,
    hazard_info: Optional[str] = None,
    source: str = "field_officer",
    timestamp: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Updates the operational accessibility of a road segment in the graph.
    Preserves audit history and recalculates traversal weights.
    """
    ts = str(timestamp or datetime.now(timezone.utc))
    raw_status = new_status.lower()

    if raw_status in ("closed", "blocked"):
        status = "closed"
        is_passable = False
        penalty = 999999.0
    elif raw_status in ("partially_open", "partially_accessible", "partial"):
        status = "partially_accessible"
        is_passable = True
        penalty = 2.5
    elif raw_status in ("unknown", "unverified"):
        status = "unknown"
        is_passable = True
        penalty = 2.0
    else:
        status = "open"
        is_passable = True
        penalty = 1.0

    found_edges = 0
    updated_edges = []

    for u, v, data in graph.edges(data=True):
        if data.get("road_id") == road_id:
            found_edges += 1
            data["status"] = status
            data["passable"] = is_passable
            dist = data.get("distance_km", 10.0)
            data["weight"] = dist * penalty
            data["last_updated"] = ts
            data["source"] = source
            if hazard_info:
                data["hazard_info"] = hazard_info

            history = data.setdefault("update_history", [])
            history.append({
                "status": status,
                "timestamp": ts,
                "source": source,
                "reason": hazard_info,
            })
            updated_edges.append((u, v))

    return {
        "road_id": road_id,
        "new_status": status,
        "is_passable": is_passable,
        "edges_updated": found_edges,
        "updated_at": ts,
        "source": source,
        "found": found_edges > 0,
    }
