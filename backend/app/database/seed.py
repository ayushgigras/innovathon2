import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine
from app.database.base import Base
from app.models.user import User
from app.models.incident import Incident, IncidentReport
from app.models.road import RoadSegment
from app.models.settlement import Settlement
from app.models.facility import CriticalFacility
from app.models.relief import ReliefRequest, InventoryItem, ReliefAllocation, Delivery
from app.models.audit import AuditLog


def seed_database(db: Session) -> None:
    """Populates the database with realistic synthetic J&K disaster scenario data."""
    Base.metadata.create_all(bind=db.get_bind())
    # Check if data already exists
    if db.query(Incident).count() > 0:
        return

    now = datetime.now(timezone.utc)

    # 1. Users
    users = [
        User(
            id="USR-001",
            name="Imran Khan",
            email="imran.khan@ddma.jk.gov.in",
            role="ddma_officer",
            district="Ramban",
            phone="+91-1998-266100",
        ),
        User(
            id="USR-002",
            name="Sunil Sharma",
            email="sunil.pwd@jk.gov.in",
            role="field_officer",
            district="Shopian",
            phone="+91-1933-260200",
        ),
        User(
            id="USR-003",
            name="Fatima Begum",
            email="fatima@redcross-jk.org",
            role="ngo_partner",
            district="Doda",
            phone="+91-1996-233150",
        ),
    ]
    db.add_all(users)

    # 2. Critical Facilities
    facilities = [
        CriticalFacility(
            id="FAC-001",
            name="District Hospital Ramban",
            type="hospital",
            district="Ramban",
            lat=33.241,
            lng=75.250,
            operational_status="operational",
            capacity=150,
        ),
        CriticalFacility(
            id="FAC-002",
            name="Sub-District Hospital Banihal",
            type="hospital",
            district="Ramban",
            lat=33.498,
            lng=75.205,
            operational_status="operational",
            capacity=80,
        ),
        CriticalFacility(
            id="FAC-003",
            name="DDMA Central Relief Depot Batote",
            type="warehouse",
            district="Ramban",
            lat=33.210,
            lng=75.260,
            operational_status="operational",
            capacity=5000,
        ),
        CriticalFacility(
            id="FAC-004",
            name="District Hospital Shopian",
            type="hospital",
            district="Shopian",
            lat=33.720,
            lng=74.830,
            operational_status="operational",
            capacity=120,
        ),
    ]
    db.add_all(facilities)

    # 3. Settlements
    settlements = [
        Settlement(
            id="SET-001",
            name="Khari Village",
            district="Ramban",
            population=420,
            lat=33.27,
            lng=75.29,
            is_isolated=True,
            isolated_since=now - timedelta(hours=2),
            access_roads_json=json.dumps(["RD-001"]),
            nearest_facility_name="District Hospital Ramban",
            nearest_facility_type="hospital",
            nearest_facility_distance_km=8.2,
            is_simulated=True,
        ),
        Settlement(
            id="SET-002",
            name="Batote Town",
            district="Ramban",
            population=2100,
            lat=33.21,
            lng=75.26,
            is_isolated=False,
            access_roads_json=json.dumps(["RD-001", "RD-003"]),
            nearest_facility_name="DDMA Central Relief Depot Batote",
            nearest_facility_type="warehouse",
            nearest_facility_distance_km=1.5,
            is_simulated=True,
        ),
        Settlement(
            id="SET-003",
            name="Hirpura",
            district="Shopian",
            population=180,
            lat=33.74,
            lng=74.88,
            is_isolated=True,
            isolated_since=now - timedelta(hours=6),
            access_roads_json=json.dumps(["RD-002"]),
            nearest_facility_name="District Hospital Shopian",
            nearest_facility_type="hospital",
            nearest_facility_distance_km=15.3,
            is_simulated=True,
        ),
        Settlement(
            id="SET-004",
            name="Palmarpur",
            district="Doda",
            population=350,
            lat=32.98,
            lng=75.74,
            is_isolated=True,
            isolated_since=now - timedelta(hours=12),
            access_roads_json=json.dumps(["RD-004"]),
            nearest_facility_name="CHC Gandoh",
            nearest_facility_type="hospital",
            nearest_facility_distance_km=9.8,
            is_simulated=True,
        ),
        Settlement(
            id="SET-005",
            name="Gandoh",
            district="Doda",
            population=920,
            lat=33.0,
            lng=75.76,
            is_isolated=False,
            access_roads_json=json.dumps(["RD-004"]),
            nearest_facility_name="CHC Gandoh",
            nearest_facility_type="hospital",
            nearest_facility_distance_km=2.1,
            is_simulated=True,
        ),
    ]
    db.add_all(settlements)

    # 4. Road Segments
    roads = [
        RoadSegment(
            id="RD-001",
            name="NH-44 Ramban Sector",
            highway_ref="NH-44",
            district="Ramban",
            status="closed",
            lat_start=33.22,
            lng_start=75.24,
            lat_end=33.26,
            lng_end=75.27,
            closure_reason="Major landslide debris across 50m highway section",
            affected_from=now - timedelta(hours=2),
            estimated_clearance=now + timedelta(hours=10),
            coordinates_json=json.dumps([{"lat": 33.22, "lng": 75.24}, {"lat": 33.26, "lng": 75.27}]),
            affected_settlements_json=json.dumps(["SET-001", "SET-002"]),
            alternate_route_available=True,
            is_simulated=True,
        ),
        RoadSegment(
            id="RD-002",
            name="Mughal Road Shopian",
            highway_ref="Mughal Road",
            district="Shopian",
            status="closed",
            lat_start=33.70,
            lng_start=74.82,
            lat_end=33.73,
            lng_end=74.86,
            closure_reason="Road surface collapse due to cloudburst",
            affected_from=now - timedelta(hours=6),
            estimated_clearance=now + timedelta(hours=24),
            coordinates_json=json.dumps([{"lat": 33.70, "lng": 74.82}, {"lat": 33.73, "lng": 74.86}]),
            affected_settlements_json=json.dumps(["SET-003"]),
            alternate_route_available=False,
            is_simulated=True,
        ),
        RoadSegment(
            id="RD-003",
            name="Banihal-Ramban Highway",
            highway_ref="NH-44",
            district="Ramban",
            status="partially_open",
            lat_start=33.48,
            lng_start=75.19,
            lat_end=33.52,
            lng_end=75.23,
            closure_reason="Rockfall single lane clearance in progress",
            affected_from=now - timedelta(hours=8),
            coordinates_json=json.dumps([{"lat": 33.48, "lng": 75.19}, {"lat": 33.52, "lng": 75.23}]),
            affected_settlements_json=json.dumps([]),
            alternate_route_available=True,
            is_simulated=True,
        ),
        RoadSegment(
            id="RD-004",
            name="Bhaderwah Bridge Road",
            highway_ref="Link Road",
            district="Doda",
            status="partially_open",
            lat_start=32.97,
            lng_start=75.72,
            lat_end=32.99,
            lng_end=75.73,
            closure_reason="Bridge damaged by flood waters — light vehicles only",
            affected_from=now - timedelta(hours=12),
            coordinates_json=json.dumps([{"lat": 32.97, "lng": 75.72}, {"lat": 32.99, "lng": 75.73}]),
            affected_settlements_json=json.dumps(["SET-004", "SET-005"]),
            alternate_route_available=False,
            is_simulated=True,
        ),
    ]
    db.add_all(roads)

    # 5. Incidents
    incidents = [
        Incident(
            id="INC-001",
            title="Landslide blocks NH-44 near Ramban",
            description="Major landslide reported at NH-44, approximately 3km north of Ramban town. Multiple vehicles stranded. Debris approximately 50m wide.",
            type="landslide",
            status="verified",
            severity="critical",
            lat=33.244,
            lng=75.258,
            district="Ramban",
            source="field_officer",
            reporter_id="USR-002",
            evidence_json=json.dumps([{
                "id": "EV-001-1",
                "type": "image",
                "url": "/demo/landslide-01.jpg",
                "caption": "Debris field on NH-44 north approach",
                "uploadedAt": (now - timedelta(hours=2)).isoformat(),
                "uploadedBy": "field_officer_01",
                "aiAnalyzed": True,
                "aiCaption": "Large debris field, estimated 200+ cubic meters. Road fully blocked.",
            }]),
            ai_location_confidence=0.91,
            ai_duplicate_score=0.04,
            ai_timestamp_confidence=0.95,
            ai_uncertainty_note="",
            is_simulated=True,
            created_at=now - timedelta(hours=2),
            updated_at=now - timedelta(hours=1),
        ),
        Incident(
            id="INC-002",
            title="Flash flood in Chenab basin — Doda sector",
            description="Residents report rapid rise in Chenab river levels near Doda. Several low-lying areas inundated. Evacuation in progress.",
            type="flood",
            status="under_review",
            severity="high",
            lat=33.148,
            lng=75.546,
            district="Doda",
            source="citizen_app",
            evidence_json=json.dumps([]),
            ai_location_confidence=0.74,
            ai_duplicate_score=0.12,
            ai_timestamp_confidence=0.78,
            ai_uncertainty_note="No photographic evidence, Single source report",
            is_simulated=True,
            created_at=now - timedelta(hours=4),
            updated_at=now - timedelta(hours=3),
        ),
        Incident(
            id="INC-003",
            title="Road collapse on Mughal Road near Shopian",
            description="Heavy rainfall caused road surface collapse on Mughal Road. 15m section missing. No injuries reported.",
            type="road_block",
            status="verified",
            severity="high",
            lat=33.713,
            lng=74.84,
            district="Shopian",
            source="field_officer",
            evidence_json=json.dumps([{
                "id": "EV-003-1",
                "type": "image",
                "url": "/demo/road-collapse-01.jpg",
                "caption": "Road subsidence near Hirpura",
                "uploadedAt": (now - timedelta(hours=6)).isoformat(),
                "uploadedBy": "field_officer_02",
                "aiAnalyzed": True,
                "aiCaption": "Subsidence clearly visible. Approximately 15m affected.",
            }]),
            ai_location_confidence=0.88,
            ai_duplicate_score=0.02,
            ai_timestamp_confidence=0.90,
            ai_uncertainty_note="",
            is_simulated=True,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=5),
        ),
        Incident(
            id="INC-004",
            title="Partial building damage reported in Kishtwar old town",
            description="Partial collapse of residential boundary wall following rockfall. 3 families moved to community center.",
            type="other",
            status="reported",
            severity="critical",
            lat=33.313,
            lng=75.771,
            district="Kishtwar",
            source="citizen_app",
            evidence_json=json.dumps([]),
            ai_location_confidence=0.55,
            ai_duplicate_score=0.28,
            ai_timestamp_confidence=0.60,
            ai_uncertainty_note="No coordinates provided, Unverified citizen source",
            is_simulated=True,
            created_at=now - timedelta(minutes=30),
            updated_at=now - timedelta(minutes=25),
        ),
        Incident(
            id="INC-005",
            title="Banihal sector minor rockfall",
            description="Small rockfall reported. Single lane passable. Border Roads Organisation notified.",
            type="landslide",
            status="verified",
            severity="medium",
            lat=33.50,
            lng=75.21,
            district="Ramban",
            source="field_officer",
            evidence_json=json.dumps([]),
            ai_location_confidence=0.82,
            ai_duplicate_score=0.08,
            ai_timestamp_confidence=0.85,
            ai_uncertainty_note="",
            is_simulated=True,
            created_at=now - timedelta(hours=8),
            updated_at=now - timedelta(hours=7),
        ),
    ]
    db.add_all(incidents)

    # 6. Inventory Items
    inventory = [
        InventoryItem(
            id="RI-001",
            name="Food Packets (family kit)",
            category="food",
            unit="kit",
            quantity_available=1200,
            quantity_reserved=340,
            warehouse_id="WH-01",
        ),
        InventoryItem(
            id="RI-002",
            name="Drinking Water (20L)",
            category="water",
            unit="can",
            quantity_available=800,
            quantity_reserved=150,
            warehouse_id="WH-01",
        ),
        InventoryItem(
            id="RI-003",
            name="Emergency Shelter Kit",
            category="shelter",
            unit="kit",
            quantity_available=200,
            quantity_reserved=45,
            warehouse_id="WH-02",
        ),
        InventoryItem(
            id="RI-004",
            name="First Aid Kit",
            category="medicine",
            unit="kit",
            quantity_available=350,
            quantity_reserved=80,
            warehouse_id="WH-01",
        ),
        InventoryItem(
            id="RI-005",
            name="Blankets",
            category="clothing",
            unit="piece",
            quantity_available=1500,
            quantity_reserved=200,
            warehouse_id="WH-02",
        ),
    ]
    db.add_all(inventory)

    # 7. Relief Requests
    requests = [
        ReliefRequest(
            id="RR-001",
            settlement_id="SET-001",
            requested_by="field_officer_01",
            status="pending",
            priority="critical",
            items_json=json.dumps([
                {"itemId": "RI-001", "name": "Food Packets", "quantityRequested": 100},
                {"itemId": "RI-002", "name": "Drinking Water (20L)", "quantityRequested": 50},
                {"itemId": "RI-004", "name": "First Aid Kit", "quantityRequested": 10},
            ]),
            ai_feasibility_score=0.72,
            ai_rationale="Population 420; 3-day buffer requested.",
            is_simulated=True,
            created_at=now - timedelta(hours=1),
            updated_at=now - timedelta(minutes=30),
        ),
        ReliefRequest(
            id="RR-002",
            settlement_id="SET-003",
            requested_by="ngo_partner_01",
            status="pending",
            priority="high",
            items_json=json.dumps([
                {"itemId": "RI-001", "name": "Food Packets", "quantityRequested": 45},
                {"itemId": "RI-003", "name": "Emergency Shelter Kit", "quantityRequested": 12},
            ]),
            ai_feasibility_score=0.68,
            ai_rationale="Population 180; shelter kits urgent.",
            is_simulated=True,
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=2),
        ),
        ReliefRequest(
            id="RR-003",
            settlement_id="SET-004",
            requested_by="ddma_officer_01",
            status="approved",
            priority="high",
            items_json=json.dumps([
                {"itemId": "RI-001", "name": "Food Packets", "quantityRequested": 90, "quantityApproved": 90},
                {"itemId": "RI-005", "name": "Blankets", "quantityRequested": 70, "quantityApproved": 70},
            ]),
            ai_feasibility_score=0.88,
            is_simulated=True,
            created_at=now - timedelta(hours=8),
            updated_at=now - timedelta(hours=6),
        ),
    ]
    db.add_all(requests)

    # 8. Deliveries
    deliveries = [
        Delivery(
            id="DEL-001",
            request_id="RR-003",
            settlement_id="SET-004",
            vehicle_id="VH-07",
            driver_name="Mohammad Yusuf",
            status="in_transit",
            scheduled_at=now - timedelta(hours=2),
            items_json=json.dumps([
                {"name": "Food Packets", "quantity": 90},
                {"name": "Blankets", "quantity": 70},
            ]),
            is_simulated=True,
            created_at=now - timedelta(hours=2),
        )
    ]
    db.add_all(deliveries)

    # 9. Audit Logs
    audit = AuditLog(
        action="database_seeded",
        entity_type="system",
        entity_id="SYSTEM-INIT",
        performed_by="seed_script",
        details_json=json.dumps({"environment": "DEMO / SIMULATED", "region": "Jammu & Kashmir"}),
    )
    db.add(audit)

    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    print("Database seeded successfully with simulated demo data.")
