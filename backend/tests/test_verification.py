def test_verification_analysis(client):
    response = client.post("/api/v1/verification/analyze/INC-001")
    assert response.status_code == 200
    data = response.json()
    assert data["incident_id"] == "INC-001"
    assert 0.0 <= data["confidence"] <= 1.0
    assert 0.0 <= data["duplicate_probability"] <= 1.0
    assert "recommended_action" in data
    assert "disclaimer" in data


def test_get_verification_analysis(client):
    response = client.get("/api/v1/verification/INC-001")
    assert response.status_code == 200
    data = response.json()
    assert data["incident_id"] == "INC-001"
