from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.common import IncidentStatus, IncidentSeverity, IncidentType, IncidentSource, GeoPoint


class EvidenceItemSchema(BaseModel):
    id: Optional[str] = None
    type: str = "image"
    url: str
    caption: Optional[str] = None
    uploadedAt: Optional[str] = None
    uploadedBy: Optional[str] = None
    aiAnalyzed: bool = False
    aiCaption: Optional[str] = None


class AIScoreSchema(BaseModel):
    confidence: float = Field(..., ge=0.0, le=1.0)
    duplicateProbability: float = Field(..., ge=0.0, le=1.0)
    consistencyScore: float = Field(..., ge=0.0, le=1.0)
    uncertaintyFlags: List[str] = []
    label: str = "AI Recommendation (unverified — human review required)"


class IncidentBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    type: IncidentType = IncidentType.OTHER
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    district: str
    source: IncidentSource = IncidentSource.CITIZEN_APP


class IncidentCreate(IncidentBase):
    reporter_id: Optional[str] = None
    evidence: List[EvidenceItemSchema] = []


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus
    reviewer_id: Optional[str] = None
    reviewer_note: Optional[str] = None


class IncidentResponse(IncidentBase):
    id: str
    status: IncidentStatus
    reporter_id: Optional[str] = None
    evidence: List[EvidenceItemSchema] = []
    aiScore: Optional[AIScoreSchema] = None
    human_reviewer_id: Optional[str] = None
    reviewer_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    is_simulated: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncidentReportCreate(BaseModel):
    reporter_name: Optional[str] = None
    location_text: str = Field(..., min_length=2, max_length=255)
    lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    lng: Optional[float] = Field(None, ge=-180.0, le=180.0)
    incident_type: IncidentType
    severity: IncidentSeverity
    description: str = Field(..., min_length=10)
    photo_url: Optional[str] = None


class IncidentReportResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    reporter_name: Optional[str] = None
    location_text: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    incident_type: IncidentType
    severity: IncidentSeverity
    description: str
    photo_url: Optional[str] = None
    status: str
    source: str
    created_at: datetime

    class Config:
        from_attributes = True
