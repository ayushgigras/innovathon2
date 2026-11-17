import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.incident import IncidentReport
from app.schemas.incident import IncidentReportCreate, IncidentReportResponse

router = APIRouter()


@router.post("/report", response_model=IncidentReportResponse, status_code=status.HTTP_201_CREATED, tags=["Public"])
def submit_public_report(
    payload: IncidentReportCreate,
    db: Session = Depends(get_db),
) -> IncidentReportResponse:
    """
    Public citizen incident submission endpoint.
    Queues damage and hazard reports for human DDMA verification with zero PII leaks.
    """
    report_id = f"RPT-{uuid.uuid4().hex[:6].upper()}"

    report = IncidentReport(
        id=report_id,
        reporter_name=payload.reporter_name or "Anonymous Citizen",
        location_text=payload.location_text,
        lat=payload.lat,
        lng=payload.lng,
        incident_type=payload.incident_type.value,
        severity=payload.severity.value,
        description=payload.description,
        photo_url=payload.photo_url,
        status="queued_for_review",
        source="citizen_app",
        created_at=datetime.now(timezone.utc),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return IncidentReportResponse.model_validate(report)
