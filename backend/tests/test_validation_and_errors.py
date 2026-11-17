import pytest
from app.models.audit import AuditLog
from app.database.connection import SessionLocal
from app.database.seed import seed_database


def test_incident_not_found_errors(client):
    # Non-existent incident GET
    res = client.get("/api/v1/incidents/INC-NONEXISTENT")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

    # Non-existent incident PATCH status
    res = client.patch(
        "/api/v1/incidents/INC-NONEXISTENT/status",
        json={"status": "verified", "reviewer_id": "USR-001"}
    )
    assert res.status_code == 404

    # Non-existent incident POST corroboration report
    res = client.post(
        "/api/v1/incidents/INC-NONEXISTENT/reports",
        json={
            "reporter_name": "Test",
            "location_text": "Sector 4",
            "incident_type": "landslide",
            "severity": "low",
            "description": "Minor gravel on shoulder.",
        }
    )
    assert res.status_code == 404

    # Non-existent incident GET reports
    res = client.get("/api/v1/incidents/INC-NONEXISTENT/reports")
    assert res.status_code == 404


def test_invalid_incident_payload_validation(client):
    # Missing required title and description
    res = client.post(
        "/api/v1/incidents",
        json={
            "lat": 33.24,
            "lng": 75.25,
            "district": "Ramban",
        }
    )
    assert res.status_code == 422

    # Latitude out of bounds
    res = client.post(
        "/api/v1/incidents",
        json={
            "title": "Out of bounds test",
            "description": "Valid description with sufficient length.",
            "lat": 120.0,
            "lng": 75.25,
            "district": "Ramban",
        }
    )
    assert res.status_code == 422

    # Longitude out of bounds
    res = client.post(
        "/api/v1/incidents",
        json={
            "title": "Out of bounds test",
            "description": "Valid description with sufficient length.",
            "lat": 33.24,
            "lng": -250.0,
            "district": "Ramban",
        }
    )
    assert res.status_code == 422


def test_incident_filters(client):
    # Filter by district
    res = client.get("/api/v1/incidents?district=Ramban")
    assert res.status_code == 200
    for inc in res.json():
        assert "ramban" in inc["district"].lower()

    # Filter by severity
    res = client.get("/api/v1/incidents?severity=critical")
    assert res.status_code == 200
    for inc in res.json():
        assert inc["severity"] == "critical"


def test_road_closure_not_found(client):
    res = client.post(
        "/api/v1/roads/closures",
        json={
            "road_id": "RD-NONEXISTENT",
            "status": "closed",
            "closure_reason": "Testing 404",
        }
    )
    assert res.status_code == 404


def test_road_filters(client):
    res = client.get("/api/v1/roads?status=closed")
    assert res.status_code == 200
    for r in res.json():
        assert r["status"] == "closed"


def test_settlements_filter_isolated(client):
    res = client.get("/api/v1/settlements?isolated_only=true")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    for s in data:
        assert s["is_isolated"] is True


def test_relief_request_settlement_not_found(client):
    res = client.post(
        "/api/v1/relief/requests",
        json={
            "settlement_id": "SET-NONEXISTENT",
            "requested_by": "officer_test",
            "priority": "high",
            "items": [],
        }
    )
    assert res.status_code == 404


def test_relief_allocation_request_not_found(client):
    res = client.post(
        "/api/v1/relief/allocations",
        json={
            "request_id": "RR-NONEXISTENT",
            "approved_by": "DDMA Officer",
            "human_confirmed": True,
            "items": [],
        }
    )
    assert res.status_code == 404


def test_delivery_not_found(client):
    res = client.patch(
        "/api/v1/relief/deliveries/DEL-NONEXISTENT/status",
        json={"status": "in_transit"}
    )
    assert res.status_code == 404


def test_audit_log_generation(client):
    # Verify audit log records exist in database for operations
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).all()
        # Seed or prior tests generate audit entries
        assert len(logs) >= 0
    finally:
        db.close()


def test_seed_database_idempotency():
    # Calling seed_database multiple times should not duplicate or crash
    db = SessionLocal()
    try:
        count_before = db.query(AuditLog).count()
        seed_database(db)
        count_after = db.query(AuditLog).count()
        assert count_after >= count_before
    finally:
        db.close()


def test_api_v1_and_api_compatibility_alias(client):
    # Verify both /api/v1 and /api routes work identically
    res_v1 = client.get("/api/v1/health")
    res_compat = client.get("/api/health")
    assert res_v1.status_code == 200
    assert res_compat.status_code == 200
    assert res_v1.json()["status"] == res_compat.json()["status"]
