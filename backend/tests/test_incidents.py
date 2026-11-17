def test_list_incidents(client):
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)
    assert len(incidents) >= 4
    # Check shape
    first = incidents[0]
    assert "id" in first
    assert "title" in first
    assert "severity" in first
    assert "status" in first


def test_get_incident_detail(client):
    response = client.get("/api/v1/incidents/INC-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "INC-001"
    assert data["district"] == "Ramban"
    assert data["status"] == "verified"
    assert data["aiScore"] is not None


def test_get_nonexistent_incident(client):
    response = client.get("/api/v1/incidents/INC-999999")
    assert response.status_code == 404


def test_create_incident_valid(client):
    payload = {
        "title": "Fresh mudslide blocking road near Banihal",
        "description": "Mudslide detected by drone reconnaissance. Single lane passable.",
        "type": "landslide",
        "severity": "high",
        "lat": 33.51,
        "lng": 75.22,
        "district": "Ramban",
        "source": "field_officer",
        "reporter_id": "USR-002",
        "evidence": [],
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["status"] == "reported"
    assert data["id"].startswith("INC-")


def test_create_incident_invalid_coordinates(client):
    payload = {
        "title": "Invalid coords incident",
        "description": "Testing boundary coordinate validation.",
        "type": "landslide",
        "severity": "medium",
        "lat": 195.0,  # Invalid latitude (>90)
        "lng": 75.22,
        "district": "Ramban",
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_update_incident_status_human_verification(client):
    payload = {
        "status": "verified",
        "reviewer_id": "USR-001",
        "reviewer_note": "Verified via drone reconnaissance feed.",
    }
    response = client.patch("/api/v1/incidents/INC-002/status", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "verified"
    assert data["human_reviewer_id"] == "USR-001"
    assert data["reviewer_note"] == payload["reviewer_note"]
    assert data["reviewed_at"] is not None


def test_incident_corroboration_reports(client):
    # Attach a citizen report to INC-001
    report_payload = {
        "reporter_name": "Local Citizen",
        "location_text": "NH-44 KM Marker 132",
        "incident_type": "landslide",
        "severity": "critical",
        "description": "Debris is spilling over the parapet. Trapped two trucks.",
    }
    post_res = client.post("/api/v1/incidents/INC-001/reports", json=report_payload)
    assert post_res.status_code == 201
    report_data = post_res.json()
    assert report_data["incident_id"] == "INC-001"
    assert report_data["id"].startswith("RPT-")

    # List reports
    list_res = client.get("/api/v1/incidents/INC-001/reports")
    assert list_res.status_code == 200
    reports = list_res.json()
    assert len(reports) >= 1
    assert any(r["id"] == report_data["id"] for r in reports)
