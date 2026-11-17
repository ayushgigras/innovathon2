from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, default=lambda: f"INC-{uuid.uuid4().hex[:8]}")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, default="other")
    status = Column(String(50), nullable=False, default="reported", index=True)
    severity = Column(String(50), nullable=False, default="medium", index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    district = Column(String(100), nullable=False, index=True)
    source = Column(String(50), nullable=False, default="citizen_app")
    reporter_id = Column(String(50), nullable=True)

    evidence_json = Column(Text, nullable=False, default="[]")

    ai_duplicate_score = Column(Float, nullable=True)
    ai_location_confidence = Column(Float, nullable=True)
    ai_timestamp_confidence = Column(Float, nullable=True)
    ai_evidence_quality = Column(Float, nullable=True)
    ai_uncertainty_note = Column(Text, nullable=True)

    human_reviewer_id = Column(String(50), nullable=True)
    reviewer_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    reports = relationship("IncidentReport", back_populates="incident", cascade="all, delete-orphan")


class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(String(50), primary_key=True, default=lambda: f"RPT-{uuid.uuid4().hex[:8]}")
    incident_id = Column(String(50), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_name = Column(String(100), nullable=True)
    location_text = Column(String(255), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    incident_type = Column(String(50), nullable=False)
    severity = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    photo_url = Column(String(500), nullable=True)
    status = Column(String(50), nullable=False, default="queued_for_review")
    source = Column(String(50), nullable=False, default="citizen_app")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="reports")
