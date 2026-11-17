from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.common import ReliefPriority, ReliefStatus, DeliveryStatus


class RequestedItemSchema(BaseModel):
    itemId: str
    name: str
    quantityRequested: int = Field(..., gt=0)
    quantityApproved: Optional[int] = None


class AISuggestedItemSchema(BaseModel):
    itemId: str
    quantity: int = Field(..., gt=0)
    rationale: str


class AIAllocationSuggestionSchema(BaseModel):
    label: str = "AI Recommendation (unverified — human review required)"
    suggestedItems: List[AISuggestedItemSchema]
    feasibilityScore: float = Field(..., ge=0.0, le=1.0)


class ReliefRequestCreate(BaseModel):
    settlement_id: str
    requested_by: str = Field(..., min_length=2)
    priority: ReliefPriority = ReliefPriority.MEDIUM
    items: List[RequestedItemSchema] = []


class ReliefRequestResponse(BaseModel):
    id: str
    settlementId: str
    settlementName: Optional[str] = None
    district: Optional[str] = None
    requestedBy: str
    status: ReliefStatus
    priority: ReliefPriority
    items: List[RequestedItemSchema] = []
    aiAllocationSuggestion: Optional[AIAllocationSuggestionSchema] = None
    is_simulated: bool = True
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class InventoryItemResponse(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    quantityAvailable: int
    quantityReserved: int
    warehouseId: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReliefAllocationCreate(BaseModel):
    request_id: str
    items: List[RequestedItemSchema]
    approved_by: str = Field(..., min_length=2, description="Authorised officer name/ID")
    approval_notes: Optional[str] = None
    human_confirmed: bool = Field(..., description="Must explicitly confirm human review")


class ReliefAllocationResponse(BaseModel):
    id: str
    request_id: str
    status: str
    approved_by: Optional[str] = None
    approval_notes: Optional[str] = None
    approved_at: Optional[datetime] = None
    items: List[RequestedItemSchema] = []
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryItemSchema(BaseModel):
    name: str
    quantity: int


class DeliveryResponse(BaseModel):
    id: str
    requestId: str
    settlementId: str
    settlementName: Optional[str] = None
    district: Optional[str] = None
    status: DeliveryStatus
    scheduledAt: datetime
    deliveredAt: Optional[datetime] = None
    vehicleId: Optional[str] = None
    driverName: Optional[str] = None
    items: List[DeliveryItemSchema] = []
    is_simulated: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus
    driver_note: Optional[str] = None
