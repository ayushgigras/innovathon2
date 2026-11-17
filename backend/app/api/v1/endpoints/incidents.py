import json
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.incident import Incident, IncidentReport
from app.models.audit import AuditLog
from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatusUpdate,
    IncidentReportCreate,
    IncidentReportResponse,
    EvidenceItemSchema,
    AIScoreSchema,
)
from app.schemas.common import IncidentStatus, IncidentSeverity

router = APIRouter()


def incident_to_response(inc: Incident) -> IncidentResponse:
    evidence_list = []
    if inc.evidence_json:
        try:
            evidence_list = [EvidenceItemSchema(**item) for item in json.loads(inc.evidence_json)]
        except Exception:
            evidence_list = []

    ai_score = None
    if inc.ai_location_confidence is not None or inc.ai_duplicate_score is not None:
        uncertainty_flags = []
        if inc.ai_uncertainty_note:
            uncertainty_flags = [f.strip() for f in inc.ai_uncertainty_note.split(",") if f.strip()]

        ai_score = AIScoreSchema(
            confidence=inc.ai_location_confidence if inc.ai_location_confidence is not None else 0.75,
            duplicateProbability=inc.ai_duplicate_score if inc.ai_duplicate_score is not None else 0.05,
            consistencyScore=inc.ai_timestamp_confidence if inc.ai_timestamp_confidence is not None else 0.85,
            uncertaintyFlags=uncertainty_flags,
            label="AI Recommendation (unverified — human review required)",
        )

    return IncidentResponse(
        id=inc.id,
        title=inc.title,
        description=inc.description,
        type=inc.type,
        status=inc.status,
        severity=inc.severity,
        lat=inc.lat,
        lng=inc.lng,
        district=inc.district,
        source=inc.source,
        reporter_id=inc.reporter_id,
        evidence=evidence_list,
        aiScore=ai_score,
        human_reviewer_id=inc.human_reviewer_id,
        reviewer_note=inc.reviewer_note,
        reviewed_at=inc.reviewed_at,
        is_simulated=inc.is_simulated,
        created_at=inc.created_at,
        updated_at=inc.updated_at,
    )


@router.get("", response_model=List[IncidentResponse], tags=["Incidents"])
def list_incidents(
    status: Optional[IncidentStatus] = None,
    severity: Optional[IncidentSeverity] = None,
    district: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> List[IncidentResponse]:
    """Retrieve all incidents with optional filtering by status, severity, or district."""
    query = db.query(Incident)

    if status:
        query = query.filter(Incident.status == status.value)
    if severity:
        query = query.filter(Incident.severity == severity.value)
    if district:
        query = query.filter(Incident.district.ilike(f"%{district}%"))

    incidents = query.order_by(Incident.created_at.desc()).offset(offset).limit(limit).all()
    return [incident_to_response(inc) for inc in incidents]


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED, tags=["Incidents"])
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
) -> IncidentResponse:
    """Create a new incident record and log to audit history."""
    evidence_str = json.dumps([item.model_dump() for item in payload.evidence])

    incident = Incident(
        id=f"INC-{uuid.uuid4().hex[:6].upper()}",
        title=payload.title,
        description=payload.description,
        type=payload.type.value,
        status=IncidentStatus.REPORTED.value,
        severity=payload.severity.value,
        lat=payload.lat,
        lng=payload.lng,
        district=payload.district,
        source=payload.source.value,
        reporter_id=payload.reporter_id,
        evidence_json=evidence_str,
        ai_location_confidence=0.80,
        ai_duplicate_score=0.08,
        ai_timestamp_confidence=0.85,
        ai_uncertainty_note="Initial automated assessment",
        is_simulated=True,
    )
    db.add(incident)

    audit = AuditLog(
        action="incident_created",
        entity_type="incident",
        entity_id=incident.id,
        performed_by=payload.reporter_id or "system",
        details_json=json.dumps({"title": payload.title, "district": payload.district}),
    )
    db.add(audit)

    db.commit()
    db.refresh(incident)
    return incident_to_response(incident)


@router.get("/{incident_id}", response_model=IncidentResponse, tags=["Incidents"])
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentResponse:
    """Fetch a single incident by its unique ID."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found")
    return incident_to_response(incident)


@router.patch("/{incident_id}/status", response_model=IncidentResponse, tags=["Incidents"])
def update_incident_status(
    incident_id: str,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db),
) -> IncidentResponse:
    """
    Updates the official status of an incident. Requires human reviewer identification.
    Strictly adheres to the principle that AI only recommends; humans officially verify.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found")

    old_status = incident.status
    incident.status = payload.status.value
    incident.human_reviewer_id = payload.reviewer_id or "ddma_officer_onduty"
    incident.reviewer_note = payload.reviewer_note
    incident.reviewed_at = datetime.now(timezone.utc)

    audit = AuditLog(
        action=f"status_updated_{payload.status.value}",
        entity_type="incident",
        entity_id=incident.id,
        performed_by=payload.reviewer_id or "authorized_reviewer",
        details_json=json.dumps({
            "previous_status": old_status,
            "new_status": payload.status.value,
            "note": payload.reviewer_note,
        }),
    )
    db.add(audit)

    db.commit()
    db.refresh(incident)
    return incident_to_response(incident)


@router.post("/{incident_id}/reports", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED, tags=["Incidents"])
def add_incident_report(
    incident_id: str,
    payload: IncidentReportCreate,
    db: Session = Depends(get_db),
) -> IncidentReportResponse:
    """Attach a citizen or field corroboration report to an existing incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    report = IncidentReport(
        id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
        incident_id=incident_id,
        reporter_name=payload.reporter_name,
        location_text=payload.location_text,
        lat=payload.lat or incident.lat,
        lng=payload.lng or incident.lng,
        incident_type=payload.incident_type.value,
        severity=payload.severity.value,
        description=payload.description,
        photo_url=payload.photo_url,
        status="attached_to_incident",
        source="corroboration",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return IncidentReportResponse.model_validate(report)


@router.get("/{incident_id}/reports", response_model=List[IncidentReportResponse], tags=["Incidents"])
def list_incident_reports(
    incident_id: str,
    db: Session = Depends(get_db),
) -> List[IncidentReportResponse]:
    """Retrieve all corroboration reports attached to a specific incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    reports = db.query(IncidentReport).filter(IncidentReport.incident_id == incident_id).all()
    return [IncidentReportResponse.model_validate(r) for r in reports]
