from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from datetime import datetime, timezone
import uuid
from app.database.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReliefRequest(Base):
    __tablename__ = "relief_requests"

    id = Column(String(50), primary_key=True, default=lambda: f"RR-{uuid.uuid4().hex[:8]}")
    settlement_id = Column(String(50), ForeignKey("settlements.id"), nullable=False, index=True)
    requested_by = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="pending", index=True)
    priority = Column(String(50), nullable=False, default="medium", index=True)

    items_json = Column(Text, nullable=False, default="[]")
    ai_feasibility_score = Column(Float, nullable=True)
    ai_rationale = Column(Text, nullable=True)

    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(50), primary_key=True, default=lambda: f"RI-{uuid.uuid4().hex[:8]}")
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    unit = Column(String(50), nullable=False)
    quantity_available = Column(Integer, nullable=False, default=0)
    quantity_reserved = Column(Integer, nullable=False, default=0)
    warehouse_id = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class ReliefAllocation(Base):
    __tablename__ = "relief_allocations"

    id = Column(String(50), primary_key=True, default=lambda: f"AL-{uuid.uuid4().hex[:8]}")
    request_id = Column(String(50), ForeignKey("relief_requests.id"), nullable=False, index=True)
    items_json = Column(Text, nullable=False, default="[]")
    status = Column(String(50), nullable=False, default="proposed", index=True)
    approved_by = Column(String(100), nullable=True)
    approval_notes = Column(Text, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(String(50), primary_key=True, default=lambda: f"DEL-{uuid.uuid4().hex[:8]}")
    request_id = Column(String(50), ForeignKey("relief_requests.id"), nullable=False, index=True)
    settlement_id = Column(String(50), ForeignKey("settlements.id"), nullable=False, index=True)
    vehicle_id = Column(String(50), nullable=True)
    driver_name = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="scheduled", index=True)
    scheduled_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    items_json = Column(Text, nullable=False, default="[]")
    is_simulated = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
