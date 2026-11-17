def test_list_roads(client):
    response = client.get("/api/v1/roads")
    assert response.status_code == 200
    roads = response.json()
    assert len(roads) >= 4
    first = roads[0]
    assert "name" in first
    assert "status" in first
    assert "coordinates" in first


def test_post_road_closure(client):
    payload = {
        "road_id": "RD-003",
        "status": "closed",
        "closure_reason": "Fresh rockfall blocking both lanes",
        "alternate_route_available": True,
    }
    response = client.post("/api/v1/roads/closures", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "RD-003"
    assert data["status"] == "closed"
    assert data["closure_reason"] == payload["closure_reason"]


def test_get_alternative_routes(client):
    response = client.get("/api/v1/routes/alternatives?origin=Ramban&destination=Srinagar&blocked_road_id=RD-001")
    assert response.status_code == 200
    data = response.json()
    assert data["origin"] == "Ramban"
    assert len(data["alternate_routes"]) >= 1
    first_route = data["alternate_routes"][0]
    assert first_route["passable"] is True
    assert "disclaimer" in first_route


def test_list_settlements(client):
    response = client.get("/api/v1/settlements")
    assert response.status_code == 200
    settlements = response.json()
    assert len(settlements) >= 5
    isolated = [s for s in settlements if s["is_isolated"]]
    assert len(isolated) >= 2
