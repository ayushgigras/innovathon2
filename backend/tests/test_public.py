def test_submit_public_report(client):
    payload = {
        "reporter_name": "Tariq Lone",
        "location_text": "NH-44 KM Marker 128, near Ramban bridge",
        "incident_type": "landslide",
        "severity": "critical",
        "description": "Large boulders falling from hillside. Road completely impassable.",
    }
    response = client.post("/api/v1/public/report", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"].startswith("RPT-")
    assert data["status"] == "queued_for_review"
    assert data["reporter_name"] == "Tariq Lone"
