"""
Comprehensive Unit Tests for RahatGrid Relief Coordination & Allocation Engine.
Tests request prioritization heuristics, stock headroom, partial allocations, shortage tracking,
double-allocation prevention, inaccessible depot detection, and delivery lifecycle transitions.
"""

import pytest
from datetime import datetime, timezone, timedelta
import networkx as nx

from app.services.rahatgrid import (
    prioritize_requests,
    get_available_headroom,
    recommend_allocations,
    validate_allocation,
    update_delivery_status,
)


@pytest.fixture
def mock_relief_context():
    """Generates synthetic requests, warehouse inventory, and road network for testing."""
    inventory = [
        {"id": "RI-FOOD", "name": "Food Packets (Family 3-Day)", "warehouse_id": "DEPOT-BATOTE", "unit": "kit", "quantity_available": 100, "quantity_reserved": 20}, # 80 free
        {"id": "RI-WATER", "name": "Drinking Water (20L Jerrycan)", "warehouse_id": "DEPOT-BATOTE", "unit": "can", "quantity_available": 50, "quantity_reserved": 10}, # 40 free
        {"id": "RI-MEDS", "name": "Emergency Trauma Kit", "warehouse_id": "DEPOT-BATOTE", "unit": "kit", "quantity_available": 25, "quantity_reserved": 0},      # 25 free
    ]

    requests = [
        # Request 1: Isolated village needing emergency medical & food
        {
            "id": "RR-KHARI-01",
            "settlement_id": "SET-KHARI",
            "settlement_name": "Khari Village",
            "priority": "critical",
            "is_isolated": True,
            "population": 420,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat(),
            "items": [
                {"itemId": "RI-MEDS", "name": "Emergency Trauma Kit", "quantityRequested": 10},
                {"itemId": "RI-FOOD", "name": "Food Packets (Family 3-Day)", "quantityRequested": 50},
            ],
        },
        # Request 2: Connected town needing blankets & food
        {
            "id": "RR-BATOTE-02",
            "settlement_id": "SET-BATOTE",
            "settlement_name": "Batote Town",
            "priority": "medium",
            "is_isolated": False,
            "population": 2100,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "items": [
                {"itemId": "RI-FOOD", "name": "Food Packets (Family 3-Day)", "quantityRequested": 50},
            ],
        },
    ]

    return requests, inventory


# ============================================================================
# 1. Request Prioritization Tests
# ============================================================================

def test_request_prioritization_rules(mock_relief_context):
    requests, _ = mock_relief_context

    ranked = prioritize_requests(requests)

    assert len(ranked) == 2
    # Khari Village (isolated + critical + medical needs) MUST be #1
    assert ranked[0]["request_id"] == "RR-KHARI-01"
    assert ranked[0]["priority_rank"] == 1
    assert ranked[0]["priority_score"] > ranked[1]["priority_score"]
    assert any("isolated" in r.lower() for r in ranked[0]["reasons"])
    assert any("medical" in r.lower() for r in ranked[0]["reasons"])


# ============================================================================
# 2. Inventory Headroom & Double-Allocation Prevention
# ============================================================================

def test_inventory_headroom_calculation():
    item = {"quantity_available": 200, "quantity_reserved": 80}
    assert get_available_headroom(item) == 120

    # Oversubscribed stock does not go negative
    item_neg = {"quantity_available": 50, "quantity_reserved": 65}
    assert get_available_headroom(item_neg) == 0


def test_double_allocation_prevention(mock_relief_context):
    requests, inventory = mock_relief_context

    # Total free food packets = 80
    # Request 1 (Khari) asks for 50
    # Request 2 (Batote) asks for 50
    # Total requested = 100 > 80 available!
    # Request 1 gets 50 (full), Request 2 MUST get only 30 (partial), preventing double allocation!
    res = recommend_allocations(requests, inventory)

    assert res["status"] == "success"
    allocations = res["recommended_allocations"]

    khari_alloc = next(a for a in allocations if a["request_id"] == "RR-KHARI-01")
    batote_alloc = next(a for a in allocations if a["request_id"] == "RR-BATOTE-02")

    # Khari gets full 50 food packets
    khari_food = next(i for i in khari_alloc["allocated_items"] if i["item_id"] == "RI-FOOD")
    assert khari_food["quantity"] == 50
    assert khari_alloc["is_fully_fulfilled"] is True

    # Batote gets remaining 30 food packets (not 50!)
    batote_food = next(i for i in batote_alloc["allocated_items"] if i["item_id"] == "RI-FOOD")
    assert batote_food["quantity"] == 30
    assert batote_alloc["is_fully_fulfilled"] is False
    assert len(batote_alloc["shortage_items"]) == 1
    assert batote_alloc["shortage_items"][0]["shortage"] == 20

    # Total allocated food packets across both requests = exactly 80 (available headroom)
    assert khari_food["quantity"] + batote_food["quantity"] == 80


def test_inaccessible_depot_allocation_refusal():
    # Road network where Depot is cut off from Settlement
    road_graph = nx.Graph()
    road_graph.add_edge("DEPOT-BATOTE", "Ramban", status="open", passable=True)
    # The road from Ramban to Khari is CLOSED
    road_graph.add_edge("Ramban", "SET-KHARI", status="closed", passable=False)

    requests = [{
        "id": "RR-001",
        "settlement_id": "SET-KHARI",
        "settlement_name": "Khari Village",
        "priority": "critical",
        "items": [{"itemId": "RI-WATER", "name": "Drinking Water", "quantityRequested": 20}],
    }]

    inventory = [
        {"id": "RI-WATER", "name": "Drinking Water", "warehouse_id": "DEPOT-BATOTE", "quantity_available": 100, "quantity_reserved": 0}
    ]

    res = recommend_allocations(requests, inventory, road_graph=road_graph)

    alloc = res["recommended_allocations"][0]
    assert alloc["depot_accessible"] is False
    assert len(alloc["allocated_items"]) == 0
    assert len(alloc["shortage_items"]) == 1
    assert "cut off by road closures" in alloc["shortage_items"][0]["reason"]


# ============================================================================
# 3. Human Approval Gate & Delivery Lifecycle Tests
# ============================================================================

def test_human_approval_requirement(mock_relief_context):
    requests, inventory = mock_relief_context
    res = recommend_allocations(requests, inventory)

    assert res["human_approval_required"] is True
    for alloc in res["recommended_allocations"]:
        assert alloc["requires_human_approval"] is True


def test_delivery_status_transitions():
    delivery = {
        "id": "DEL-001",
        "request_id": "RR-KHARI-01",
        "status": "proposed",
        "warehouse_id": "DEPOT-BATOTE",
    }

    # 1. Invalid jump: proposed directly to dispatched (blocked by human approval gate)
    invalid_res = update_delivery_status(delivery, "dispatched")
    assert invalid_res["success"] is False
    assert "Mandatory safety rule" in invalid_res["error"]

    # 2. Valid transition: proposed -> approved
    approved_res = update_delivery_status(delivery, "approved", source="DDMA Officer Imran Khan")
    assert approved_res["success"] is True
    assert approved_res["current_status"] == "approved"

    # Update working record
    delivery["status"] = "approved"
    delivery["status_history"] = approved_res["status_history"]

    # 3. Valid transition: approved -> dispatched
    dispatched_res = update_delivery_status(delivery, "dispatched", source="Convoy Commander")
    assert dispatched_res["success"] is True
    assert dispatched_res["current_status"] == "dispatched"

    # Update working record
    delivery["status"] = "dispatched"
    delivery["status_history"] = dispatched_res["status_history"]

    # 4. Valid transition: dispatched -> delivered
    delivered_res = update_delivery_status(
        delivery,
        "delivered",
        source="Field Verification Officer",
        driver_notes="Physical receipt signed by village council head.",
    )
    assert delivered_res["success"] is True
    assert delivered_res["current_status"] == "delivered"
    assert delivered_res["is_terminal"] is True
    assert len(delivered_res["status_history"]) == 3
