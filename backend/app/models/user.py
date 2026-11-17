from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone
import uuid
from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, default=lambda: f"USR-{uuid.uuid4().hex[:8]}")
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    role = Column(String(50), nullable=False, default="field_officer")
    district = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
