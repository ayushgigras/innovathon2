def test_list_relief_requests(client):
    response = client.get("/api/v1/relief/requests")
    assert response.status_code == 200
    requests = response.json()
    assert len(requests) >= 3
    first = requests[0]
    assert "settlementName" in first
    assert "priority" in first
    assert "items" in first


def test_create_relief_request(client):
    payload = {
        "settlement_id": "SET-002",
        "requested_by": "field_officer_batote",
        "priority": "high",
        "items": [
            {"itemId": "RI-001", "name": "Food Packets", "quantityRequested": 50},
            {"itemId": "RI-002", "name": "Drinking Water (20L)", "quantityRequested": 25},
        ],
    }
    response = client.post("/api/v1/relief/requests", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["settlementId"] == "SET-002"
    assert data["status"] == "pending"


def test_list_inventory(client):
    response = client.get("/api/v1/relief/inventory")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 5
    first = items[0]
    assert "quantityAvailable" in first
    assert "warehouseId" in first


def test_approve_allocation_requires_human_confirmation(client):
    payload = {
        "request_id": "RR-001",
        "approved_by": "DDMA Officer Imran Khan",
        "human_confirmed": False,  # Missing mandatory confirmation
        "items": [
            {"itemId": "RI-001", "name": "Food Packets", "quantityRequested": 100},
        ],
    }
    response = client.post("/api/v1/relief/allocations", json=payload)
    assert response.status_code == 400
    assert "Human confirmation required" in response.json()["detail"]


def test_approve_allocation_success(client):
    payload = {
        "request_id": "RR-001",
        "approved_by": "DDMA Officer Imran Khan",
        "approval_notes": "Emergency helicopter drop approved for Khari.",
        "human_confirmed": True,
        "items": [
            {"itemId": "RI-001", "name": "Food Packets", "quantityRequested": 100},
        ],
    }
    response = client.post("/api/v1/relief/allocations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "approved"
    assert data["approved_by"] == payload["approved_by"]

    # Verify request status became approved
    req_res = client.get("/api/v1/relief/requests")
    reqs = req_res.json()
    rr001 = next(r for r in reqs if r["id"] == "RR-001")
    assert rr001["status"] == "approved"


def test_deliveries_tracking_and_status_update(client):
    response = client.get("/api/v1/relief/deliveries")
    assert response.status_code == 200
    deliveries = response.json()
    assert len(deliveries) >= 1
    del_id = deliveries[0]["id"]

    # Update status to delivered
    patch_res = client.patch(
        f"/api/v1/relief/deliveries/{del_id}/status",
        json={"status": "delivered", "driver_note": "Handed over to village sarpanch."},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "delivered"
    assert patch_res.json()["deliveredAt"] is not None
