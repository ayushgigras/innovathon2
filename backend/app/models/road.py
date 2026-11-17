from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from datetime import datetime, timezone
import uuid
from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(50), primary_key=True, default=lambda: f"RD-{uuid.uuid4().hex[:8]}")
    name = Column(String(150), nullable=False)
    highway_ref = Column(String(50), nullable=True, index=True)
    district = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="open", index=True)

    lat_start = Column(Float, nullable=False)
    lng_start = Column(Float, nullable=False)
    lat_end = Column(Float, nullable=False)
    lng_end = Column(Float, nullable=False)

    closure_reason = Column(String(255), nullable=True)
    affected_from = Column(DateTime(timezone=True), nullable=True)
    estimated_clearance = Column(DateTime(timezone=True), nullable=True)

    coordinates_json = Column(Text, nullable=False, default="[]")
    affected_settlements_json = Column(Text, nullable=False, default="[]")
    alternate_route_available = Column(Boolean, default=False, nullable=False)

    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
