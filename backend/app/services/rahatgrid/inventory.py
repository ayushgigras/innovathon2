"""
RahatGrid Inventory Headroom & Depot Accessibility Engine.
Enforces physical stock constraints: prevents negative inventory, double allocation,
and checks road network accessibility from supply depots to requesting settlements.
"""

from typing import Dict, Any, List, Optional
import networkx as nx


def _get_field(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def get_available_headroom(item: Any) -> int:
    """Calculates uncommitted available stock: max(0, available - reserved)."""
    avail = int(_get_field(item, "quantity_available") or _get_field(item, "quantityAvailable", 0) or 0)
    res = int(_get_field(item, "quantity_reserved") or _get_field(item, "quantityReserved", 0) or 0)
    return max(0, avail - res)


def check_depot_accessibility(
    depot_id: str,
    settlement_id: str,
    road_graph: Optional[nx.Graph] = None,
) -> Dict[str, Any]:
    """
    Checks whether a supply depot has an active, passable road connection to a settlement.
    If roads between depot and settlement are blocked, allocation from this depot is physically unfeasible.
    """
    if road_graph is None:
        # Without road graph, assume accessible with advisory warning
        return {
            "is_accessible": True,
            "has_graph_verification": False,
            "warning": "Depot route accessibility unverified (no road graph supplied).",
        }

    # Filter out closed roads
    passable_edges = [
        (u, v) for u, v, data in road_graph.edges(data=True)
        if data.get("passable", True) and data.get("status") != "closed"
    ]
    passable_graph = road_graph.edge_subgraph(passable_edges).copy()

    if depot_id not in passable_graph:
        return {
            "is_accessible": False,
            "has_graph_verification": True,
            "warning": f"Depot '{depot_id}' not found in passable road network graph.",
        }

    if settlement_id not in passable_graph:
        return {
            "is_accessible": False,
            "has_graph_verification": True,
            "warning": f"Settlement '{settlement_id}' is cut off / isolated in road network graph.",
        }

    has_route = nx.has_path(passable_graph, depot_id, settlement_id)
    if has_route:
        return {
            "is_accessible": True,
            "has_graph_verification": True,
            "warning": None,
        }
    else:
        return {
            "is_accessible": False,
            "has_graph_verification": True,
            "warning": (
                f"Supply route blocked: No passable road connection exists from depot '{depot_id}' "
                f"to settlement '{settlement_id}'. Dispatch from this depot is impossible."
            ),
        }
