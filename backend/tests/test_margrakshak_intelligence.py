"""
Comprehensive Unit Tests for MargRakshak Mountain Road Intelligence Service.
Tests road network graph construction, Dijkstra routing, closed-road exclusion,
penalty multipliers, no-route conditions, settlement isolation detection, and road status updates.
"""

import pytest
import networkx as nx
from datetime import datetime, timezone

from app.services.margrakshak import (
    build_road_graph,
    calculate_alternative_route,
    identify_isolated_settlements,
    update_road_status,
)


@pytest.fixture
def sample_mountain_network():
    """
    Creates a realistic mountain road network for testing:
    - Node 'Batote' connects to 'Ramban' via 'RD-101' (Open, 15km)
    - Node 'Ramban' connects to 'Panthyal' via 'RD-102' (Closed by Landslide, 8km)
    - Node 'Panthyal' connects to 'Banihal' via 'RD-103' (Partially open, 12km)
    - Alternate Bypass: 'Ramban' connects to 'Rajgarh' via 'RD-104' (Open, 14km)
    - 'Rajgarh' connects to 'Banihal' via 'RD-105' (Open, 18km)
    - 'Khari' connects ONLY to 'Panthyal' via 'RD-SPUR' (Open, 5km)
    """
    roads = [
        {"id": "RD-101", "name": "NH-44 Batote-Ramban", "source_node": "Batote", "destination_node": "Ramban", "distance_km": 15.0, "status": "open"},
        {"id": "RD-102", "name": "NH-44 Ramban-Panthyal", "source_node": "Ramban", "destination_node": "Panthyal", "distance_km": 8.0, "status": "closed", "closure_reason": "Landslide debris"},
        {"id": "RD-103", "name": "NH-44 Panthyal-Banihal", "source_node": "Panthyal", "destination_node": "Banihal", "distance_km": 12.0, "status": "closed", "closure_reason": "Secondary rockfall"},
        {"id": "RD-104", "name": "Ramban-Rajgarh Link", "source_node": "Ramban", "destination_node": "Rajgarh", "distance_km": 14.0, "status": "open"},
        {"id": "RD-105", "name": "Rajgarh-Banihal Spine", "source_node": "Rajgarh", "destination_node": "Banihal", "distance_km": 18.0, "status": "open"},
        {"id": "RD-SPUR", "name": "Khari Spur Road", "source_node": "Khari", "destination_node": "Panthyal", "distance_km": 5.0, "status": "open"},
    ]

    settlements = [
        {"id": "SET-BATOTE", "name": "Batote Town", "population": 2100},
        {"id": "SET-KHARI", "name": "Khari Village", "population": 420},
        {"id": "SET-BANIHAL", "name": "Banihal Town", "population": 3800},
    ]

    facilities = [
        {"id": "FAC-HOSPITAL", "name": "District Hospital Batote", "type": "hospital"},
        {"id": "FAC-DEPOT", "name": "DDMA Relief Depot Batote", "type": "warehouse"},
    ]

    # Link facility and settlement nodes to the junctions
    roads.append({"id": "RD-FAC-LINK", "name": "Depot Spur", "source_node": "FAC-DEPOT", "destination_node": "Batote", "distance_km": 1.0, "status": "open"})
    roads.append({"id": "RD-HOSP-LINK", "name": "Hospital Spur", "source_node": "FAC-HOSPITAL", "destination_node": "Batote", "distance_km": 1.0, "status": "open"})
    roads.append({"id": "RD-SET-BATOTE", "name": "Batote Access", "source_node": "SET-BATOTE", "destination_node": "Batote", "distance_km": 0.5, "status": "open"})
    roads.append({"id": "RD-SET-KHARI", "name": "Khari Access", "source_node": "SET-KHARI", "destination_node": "Khari", "distance_km": 0.5, "status": "open"})

    graph = build_road_graph(roads, settlements, facilities)
    return graph, settlements, facilities


# ============================================================================
# 1. Routing & Closed Road Exclusion Tests
# ============================================================================

def test_closed_road_exclusion(sample_mountain_network):
    graph, _, _ = sample_mountain_network

    # Direct route through Panthyal (RD-102) is closed!
    # Routing must route through Rajgarh bypass (RD-104 + RD-105)
    res = calculate_alternative_route(graph, "Ramban", "Banihal")

    assert res["feasible"] is True
    assert res["routes_count"] >= 1
    best_route = res["routes"][0]
    
    # Verify the closed road RD-102 is NOT in the selected path
    assert "RD-102" not in best_route["segment_ids"]
    assert "Rajgarh" in best_route["path_nodes"]
    assert best_route["distance_km"] == 32.0  # 14km + 18km


def test_partially_accessible_road_penalty(sample_mountain_network):
    graph, _, _ = sample_mountain_network

    # Reopen RD-102 and RD-103 as partially_accessible with delay penalty
    update_road_status(graph, "RD-102", "partially_accessible")
    update_road_status(graph, "RD-103", "partially_accessible")

    # The bypass via Rajgarh (14km + 18km = 32 weight) is preferred over congested partial corridor!
    res = calculate_alternative_route(graph, "Ramban", "Banihal")

    assert res["feasible"] is True
    best_route = res["routes"][0]
    assert "Rajgarh" in best_route["path_nodes"]


def test_unknown_road_caution_handling(sample_mountain_network):
    graph, _, _ = sample_mountain_network

    # Add a shortcut road with 'unknown' status
    graph.add_edge("Ramban", "Banihal", road_id="RD-UNKNOWN-CUT", name="Unverified Track", distance_km=10.0, weight=20.0, passable=True, status="unknown")

    res = calculate_alternative_route(graph, "Ramban", "Banihal")
    assert res["feasible"] is True
    # Verify that if an unknown road is traversed or evaluated, warnings are surfaced
    routes_with_unknown = [r for r in res["routes"] if "RD-UNKNOWN-CUT" in r["segment_ids"]]
    if routes_with_unknown:
        assert any("unknown" in w.lower() for w in routes_with_unknown[0]["warnings"])


def test_no_feasible_route_condition(sample_mountain_network):
    graph, _, _ = sample_mountain_network

    # Block both the main corridor AND the bypass!
    update_road_status(graph, "RD-102", "closed")
    update_road_status(graph, "RD-104", "closed")

    res = calculate_alternative_route(graph, "Ramban", "Banihal")

    assert res["feasible"] is False
    assert len(res["routes"]) == 0
    assert "No feasible alternative route found" in res["explanation"]


# ============================================================================
# 2. Settlement Isolation & Dynamic Status Update Tests
# ============================================================================

def test_settlement_isolation_detection(sample_mountain_network):
    graph, settlements, facilities = sample_mountain_network

    # In this network:
    # 'Khari' connects ONLY to 'Panthyal'.
    # Panthyal is disconnected from Batote (hospital/depot) because RD-102 is closed!
    # Therefore, Khari village MUST be detected as ISOLATED!
    isolation_report = identify_isolated_settlements(graph, settlements, facilities)

    khari = next(s for s in isolation_report if s["settlement_id"] == "SET-KHARI")
    batote = next(s for s in isolation_report if s["settlement_id"] == "SET-BATOTE")

    assert khari["is_isolated"] is True
    assert khari["accessible_facility_count"] == 0
    assert "ISOLATED" in khari["explanation"]

    assert batote["is_isolated"] is False
    assert batote["accessible_facility_count"] >= 1


def test_road_reopening_restores_connectivity(sample_mountain_network):
    graph, settlements, facilities = sample_mountain_network

    # 1. Initially Khari is isolated
    report_1 = identify_isolated_settlements(graph, settlements, facilities)
    assert next(s for s in report_1 if s["settlement_id"] == "SET-KHARI")["is_isolated"] is True

    # 2. PWD clears landslide: reopen RD-102
    update_res = update_road_status(graph, "RD-102", "open", hazard_info="Debris cleared by PWD bulldozers")
    assert update_res["new_status"] == "open"
    assert update_res["is_passable"] is True

    # 3. Recalculate isolation: Khari should now be CONNECTED!
    report_2 = identify_isolated_settlements(graph, settlements, facilities)
    khari_reopened = next(s for s in report_2 if s["settlement_id"] == "SET-KHARI")
    assert khari_reopened["is_isolated"] is False
    assert khari_reopened["accessible_facility_count"] >= 1
    assert "CONNECTED" in khari_reopened["explanation"]
