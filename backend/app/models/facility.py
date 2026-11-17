from sqlalchemy import Column, String, Float, Integer, DateTime
from datetime import datetime, timezone
import uuid
from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CriticalFacility(Base):
    __tablename__ = "critical_facilities"

    id = Column(String(50), primary_key=True, default=lambda: f"FAC-{uuid.uuid4().hex[:8]}")
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    operational_status = Column(String(50), default="operational", nullable=False)
    capacity = Column(Integer, nullable=True)
    contact_info = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
