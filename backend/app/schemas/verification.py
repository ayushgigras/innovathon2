from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DuplicateCandidateInfo(BaseModel):
    incident_id: str
    title: str
    district: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    reasons: List[str] = []


class VerificationAnalysisResponse(BaseModel):
    incident_id: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    duplicate_probability: float = Field(..., ge=0.0, le=1.0)
    consistency_score: float = Field(..., ge=0.0, le=1.0)
    uncertainty_flags: List[str] = []
    is_duplicate_candidate: bool = False
    duplicate_candidates: List[DuplicateCandidateInfo] = []
    recommended_action: str
    label: str = "AI Recommendation (unverified — human review required)"
    disclaimer: str = (
        "AI recommendation only. The AI system does not officially verify incidents, "
        "issue warnings, or dispatch responders without human confirmation."
    )
    analyzed_at: datetime
