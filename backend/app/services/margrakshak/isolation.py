"""
Settlement Reachability & Isolation Detection Engine for MargRakshak.
Determines whether mountain settlements have reachable paths to critical facilities (hospitals, relief depots)
under current road network blockages and closures.
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import networkx as nx


def _get_attr(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def identify_isolated_settlements(
    graph: nx.Graph,
    settlements: List[Any],
    critical_facilities: List[Any],
) -> List[Dict[str, Any]]:
    """
    Evaluates reachability from each settlement to all designated critical facilities.
    A settlement is classified as 'isolated' (cut-off) if no passable path exists to ANY critical facility.
    
    Excludes edges where passable == False (closed roads).
    """
    # 1. Build a passable view of the road network (filter out closed roads)
    passable_edges = [
        (u, v) for u, v, data in graph.edges(data=True)
        if data.get("passable", True) and data.get("status") != "closed"
    ]
    passable_graph = graph.edge_subgraph(passable_edges).copy()

    # Ensure all nodes exist in passable_graph even if isolated with 0 open edges
    for node in graph.nodes:
        if node not in passable_graph:
            passable_graph.add_node(node)

    # 2. Extract facility node identifiers
    facility_node_ids = []
    facility_names = {}
    for fac in critical_facilities:
        f_id = str(_get_attr(fac, "id", ""))
        if f_id:
            facility_node_ids.append(f_id)
            facility_names[f_id] = _get_attr(fac, "name", f_id)

    # Collect all closed road segment IDs for diagnostic reporting
    closed_roads = [
        data.get("road_id") for _, _, data in graph.edges(data=True)
        if data.get("status") == "closed" or not data.get("passable", True)
    ]

    results: List[Dict[str, Any]] = []
    now_str = datetime.now(timezone.utc).isoformat()

    for s in settlements:
        s_id = str(_get_attr(s, "id", ""))
        s_name = _get_attr(s, "name", s_id)
        pop = _get_attr(s, "population", 0)

        accessible_facilities = []
        closest_distance = 999999.0

        if s_id in passable_graph:
            for f_id in facility_node_ids:
                if f_id in passable_graph and nx.has_path(passable_graph, s_id, f_id):
                    try:
                        dist = nx.shortest_path_length(passable_graph, s_id, f_id, weight="weight")
                        accessible_facilities.append({
                            "facility_id": f_id,
                            "facility_name": facility_names.get(f_id, f_id),
                            "travel_weight": round(dist, 1),
                        })
                        if dist < closest_distance:
                            closest_distance = dist
                    except (nx.NetworkXNoPath, nx.NodeNotFound):
                        pass

        # Settlement access roads check
        access_roads = _get_attr(s, "access_roads", [])
        if isinstance(access_roads, str):
            import json
            try:
                access_roads = json.loads(access_roads)
            except Exception:
                access_roads = [access_roads]

        disconnected_roads = [r for r in access_roads if r in closed_roads]

        is_isolated = len(accessible_facilities) == 0

        if is_isolated:
            explanation = (
                f"Settlement {s_name} (pop: {pop}) is ISOLATED. No passable road connection exists to any critical facility. "
                f"Blocked access roads: {disconnected_roads if disconnected_roads else 'All connecting corridors impassable'}."
            )
        else:
            fac_count = len(accessible_facilities)
            fac_names = [f["facility_name"] for f in accessible_facilities[:2]]
            explanation = (
                f"Settlement {s_name} is CONNECTED. Passable routes exist to {fac_count} critical facilities "
                f"(including {', '.join(fac_names)})."
            )

        results.append({
            "settlement_id": s_id,
            "settlement_name": s_name,
            "is_isolated": is_isolated,
            "population": pop,
            "accessible_critical_facilities": accessible_facilities,
            "accessible_facility_count": len(accessible_facilities),
            "disconnected_road_segments": disconnected_roads,
            "last_road_network_update": now_str,
            "explanation": explanation,
        })

    return results
