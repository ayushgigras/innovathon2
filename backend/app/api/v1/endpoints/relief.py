import json
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.relief import ReliefRequest, InventoryItem, ReliefAllocation, Delivery
from app.models.settlement import Settlement
from app.models.audit import AuditLog
from app.schemas.relief import (
    ReliefRequestCreate,
    ReliefRequestResponse,
    InventoryItemResponse,
    ReliefAllocationCreate,
    ReliefAllocationResponse,
    DeliveryResponse,
    DeliveryStatusUpdate,
    RequestedItemSchema,
    AIAllocationSuggestionSchema,
    AISuggestedItemSchema,
    DeliveryItemSchema,
)
from app.schemas.common import ReliefStatus, DeliveryStatus
from app.services.rahatgrid.allocation import compute_allocation_recommendation

router = APIRouter()


def request_to_response(req: ReliefRequest, db: Session) -> ReliefRequestResponse:
    settlement = db.query(Settlement).filter(Settlement.id == req.settlement_id).first()

    items = []
    if req.items_json:
        try:
            items = [RequestedItemSchema(**i) for i in json.loads(req.items_json)]
        except Exception:
            items = []

    ai_sugg = None
    if req.ai_feasibility_score is not None:
        inventory = db.query(InventoryItem).all()
        ai_sugg = compute_allocation_recommendation(req, settlement, inventory)

    return ReliefRequestResponse(
        id=req.id,
        settlementId=req.settlement_id,
        settlementName=settlement.name if settlement else "Unknown Settlement",
        district=settlement.district if settlement else "Jammu & Kashmir",
        requestedBy=req.requested_by,
        status=req.status,
        priority=req.priority,
        items=items,
        aiAllocationSuggestion=ai_sugg,
        is_simulated=req.is_simulated,
        createdAt=req.created_at,
        updatedAt=req.updated_at,
    )


@router.get("/requests", response_model=List[ReliefRequestResponse], tags=["Relief"])
def list_relief_requests(
    status: Optional[ReliefStatus] = None,
    db: Session = Depends(get_db),
) -> List[ReliefRequestResponse]:
    """List pending and approved disaster relief requests."""
    query = db.query(ReliefRequest)
    if status:
        query = query.filter(ReliefRequest.status == status.value)
    requests = query.order_by(ReliefRequest.created_at.desc()).all()
    return [request_to_response(r, db) for r in requests]


@router.post("/requests", response_model=ReliefRequestResponse, status_code=status.HTTP_201_CREATED, tags=["Relief"])
def create_relief_request(
    payload: ReliefRequestCreate,
    db: Session = Depends(get_db),
) -> ReliefRequestResponse:
    """Submit a new relief supply request for an affected settlement."""
    settlement = db.query(Settlement).filter(Settlement.id == payload.settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail=f"Settlement {payload.settlement_id} not found")

    items_str = json.dumps([i.model_dump() for i in payload.items])

    req = ReliefRequest(
        id=f"RR-{uuid.uuid4().hex[:6].upper()}",
        settlement_id=payload.settlement_id,
        requested_by=payload.requested_by,
        status=ReliefStatus.PENDING.value,
        priority=payload.priority.value,
        items_json=items_str,
        ai_feasibility_score=0.75,
        is_simulated=True,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    return request_to_response(req, db)


@router.get("/inventory", response_model=List[InventoryItemResponse], tags=["Relief"])
def list_inventory(db: Session = Depends(get_db)) -> List[InventoryItemResponse]:
    """Inspect warehouse inventory headroom across food, water, medical, and shelter kits."""
    items = db.query(InventoryItem).all()
    return [
        InventoryItemResponse(
            id=i.id,
            name=i.name,
            category=i.category,
            unit=i.unit,
            quantityAvailable=i.quantity_available,
            quantityReserved=i.quantity_reserved,
            warehouseId=i.warehouse_id,
            created_at=i.created_at,
            updated_at=i.updated_at,
        )
        for i in items
    ]


@router.post("/allocations", response_model=ReliefAllocationResponse, status_code=status.HTTP_201_CREATED, tags=["Relief"])
def approve_allocation(
    payload: ReliefAllocationCreate,
    db: Session = Depends(get_db),
) -> ReliefAllocationResponse:
    """
    Approve relief allocation from warehouse stock.
    Mandatory human confirmation gate: no AI auto-dispatch allowed.
    """
    if not payload.human_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Human confirmation required before authorizing relief allocations."
        )

    req = db.query(ReliefRequest).filter(ReliefRequest.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail=f"Relief request {payload.request_id} not found")

    items_str = json.dumps([i.model_dump() for i in payload.items])
    alloc_id = f"AL-{uuid.uuid4().hex[:6].upper()}"

    allocation = ReliefAllocation(
        id=alloc_id,
        request_id=req.id,
        items_json=items_str,
        status="approved",
        approved_by=payload.approved_by,
        approval_notes=payload.approval_notes,
        approved_at=datetime.now(timezone.utc),
    )
    db.add(allocation)

    # Update request status
    req.status = ReliefStatus.APPROVED.value

    # Reserve inventory items
    for alloc_item in payload.items:
        inv = db.query(InventoryItem).filter(InventoryItem.id == alloc_item.itemId).first()
        if inv:
            inv.quantity_reserved += alloc_item.quantityRequested

    # Create Delivery record
    delivery = Delivery(
        id=f"DEL-{uuid.uuid4().hex[:6].upper()}",
        request_id=req.id,
        settlement_id=req.settlement_id,
        status=DeliveryStatus.SCHEDULED.value,
        scheduled_at=datetime.now(timezone.utc),
        items_json=items_str,
        is_simulated=True,
    )
    db.add(delivery)

    audit = AuditLog(
        action="relief_allocation_approved",
        entity_type="relief_allocation",
        entity_id=alloc_id,
        performed_by=payload.approved_by,
        details_json=json.dumps({
            "request_id": req.id,
            "items_count": len(payload.items),
            "notes": payload.approval_notes,
        }),
    )
    db.add(audit)

    db.commit()
    db.refresh(allocation)

    return ReliefAllocationResponse(
        id=allocation.id,
        request_id=allocation.request_id,
        status=allocation.status,
        approved_by=allocation.approved_by,
        approval_notes=allocation.approval_notes,
        approved_at=allocation.approved_at,
        items=payload.items,
        created_at=allocation.created_at,
    )


@router.get("/deliveries", response_model=List[DeliveryResponse], tags=["Relief"])
def list_deliveries(
    status: Optional[DeliveryStatus] = None,
    db: Session = Depends(get_db),
) -> List[DeliveryResponse]:
    """Track in-transit relief convoys and last-mile dispatch status."""
    query = db.query(Delivery)
    if status:
        query = query.filter(Delivery.status == status.value)

    deliveries = query.all()
    results = []
    for d in deliveries:
        settlement = db.query(Settlement).filter(Settlement.id == d.settlement_id).first()
        items = []
        if d.items_json:
            try:
                items = [DeliveryItemSchema(**i) for i in json.loads(d.items_json)]
            except Exception:
                items = []

        results.append(
            DeliveryResponse(
                id=d.id,
                requestId=d.request_id,
                settlementId=d.settlement_id,
                settlementName=settlement.name if settlement else "Unknown",
                district=settlement.district if settlement else "J&K",
                status=d.status,
                scheduledAt=d.scheduled_at,
                deliveredAt=d.delivered_at,
                vehicleId=d.vehicle_id,
                driverName=d.driver_name,
                items=items,
                is_simulated=d.is_simulated,
                created_at=d.created_at,
            )
        )
    return results


@router.patch("/deliveries/{delivery_id}/status", response_model=DeliveryResponse, tags=["Relief"])
def update_delivery_status(
    delivery_id: str,
    payload: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
) -> DeliveryResponse:
    """Update delivery convoy status (e.g., mark in_transit or delivered)."""
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail=f"Delivery {delivery_id} not found")

    delivery.status = payload.status.value
    if payload.status == DeliveryStatus.DELIVERED:
        delivery.delivered_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(delivery)

    settlement = db.query(Settlement).filter(Settlement.id == delivery.settlement_id).first()
    items = []
    if delivery.items_json:
        try:
            items = [DeliveryItemSchema(**i) for i in json.loads(delivery.items_json)]
        except Exception:
            items = []

    return DeliveryResponse(
        id=delivery.id,
        requestId=delivery.request_id,
        settlementId=delivery.settlement_id,
        settlementName=settlement.name if settlement else "Unknown",
        district=settlement.district if settlement else "J&K",
        status=delivery.status,
        scheduledAt=delivery.scheduled_at,
        deliveredAt=delivery.delivered_at,
        vehicleId=delivery.vehicle_id,
        driverName=delivery.driver_name,
        items=items,
        is_simulated=delivery.is_simulated,
        created_at=delivery.created_at,
    )
