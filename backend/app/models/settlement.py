from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from datetime import datetime, timezone
import uuid
from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String(50), primary_key=True, default=lambda: f"SET-{uuid.uuid4().hex[:8]}")
    name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False, index=True)
    population = Column(Integer, nullable=False, default=0)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    is_isolated = Column(Boolean, default=False, nullable=False, index=True)
    isolated_since = Column(DateTime(timezone=True), nullable=True)
    access_roads_json = Column(Text, nullable=False, default="[]")

    nearest_facility_name = Column(String(150), nullable=True)
    nearest_facility_type = Column(String(50), nullable=True)
    nearest_facility_distance_km = Column(Float, nullable=True)

    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
