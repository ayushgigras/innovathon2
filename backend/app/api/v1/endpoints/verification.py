from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.incident import Incident
from app.schemas.verification import VerificationAnalysisResponse
from app.services.aapda_lens.deduplication import analyze_incident_verification

router = APIRouter()


@router.post("/analyze/{incident_id}", response_model=VerificationAnalysisResponse, tags=["Verification"])
def run_verification_analysis(incident_id: str, db: Session = Depends(get_db)) -> VerificationAnalysisResponse:
    """
    Triggers AI-assisted analysis for an incident to detect duplicate candidates,
    assess location & timestamp consistency, and determine evidence uncertainty.
    Results are advisory only.
    """
    target = db.query(Incident).filter(Incident.id == incident_id).first()
    if not target:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    all_incidents = db.query(Incident).all()
    analysis = analyze_incident_verification(target, all_incidents)

    # Persist the advisory score to the incident
    target.ai_location_confidence = analysis.confidence
    target.ai_duplicate_score = analysis.duplicate_probability
    target.ai_timestamp_confidence = analysis.consistency_score
    target.ai_uncertainty_note = ", ".join(analysis.uncertainty_flags)
    db.commit()

    return analysis


@router.get("/{incident_id}", response_model=VerificationAnalysisResponse, tags=["Verification"])
def get_verification_analysis(incident_id: str, db: Session = Depends(get_db)) -> VerificationAnalysisResponse:
    """Fetch current AI verification breakdown and duplicate probabilities for an incident."""
    target = db.query(Incident).filter(Incident.id == incident_id).first()
    if not target:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    all_incidents = db.query(Incident).all()
    return analyze_incident_verification(target, all_incidents)
