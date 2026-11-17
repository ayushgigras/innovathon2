import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.road import RoadSegment
from app.models.settlement import Settlement
from app.models.audit import AuditLog
from app.schemas.road import RoadSegmentResponse, RoadClosureCreate
from app.schemas.common import RoadStatus, GeoPoint

router = APIRouter()


def road_to_response(road: RoadSegment) -> RoadSegmentResponse:
    coords = []
    if road.coordinates_json:
        try:
            coords = [GeoPoint(**c) for c in json.loads(road.coordinates_json)]
        except Exception:
            coords = []

    settlements = []
    if road.affected_settlements_json:
        try:
            settlements = json.loads(road.affected_settlements_json)
        except Exception:
            settlements = []

    return RoadSegmentResponse(
        id=road.id,
        name=road.name,
        highway_ref=road.highway_ref,
        district=road.district,
        status=road.status,
        lat_start=road.lat_start,
        lng_start=road.lng_start,
        lat_end=road.lat_end,
        lng_end=road.lng_end,
        closure_reason=road.closure_reason,
        affected_from=road.affected_from,
        estimated_clearance=road.estimated_clearance,
        coordinates=coords,
        affected_settlements=settlements,
        alternate_route_available=road.alternate_route_available,
        is_simulated=road.is_simulated,
        created_at=road.created_at,
        updated_at=road.updated_at,
    )


@router.get("", response_model=List[RoadSegmentResponse], tags=["Roads"])
def list_roads(
    district: Optional[str] = None,
    status: Optional[RoadStatus] = None,
    db: Session = Depends(get_db),
) -> List[RoadSegmentResponse]:
    """List all monitored mountain road corridors in the region."""
    query = db.query(RoadSegment)
    if district:
        query = query.filter(RoadSegment.district.ilike(f"%{district}%"))
    if status:
        query = query.filter(RoadSegment.status == status.value)

    roads = query.all()
    return [road_to_response(r) for r in roads]


@router.post("/closures", response_model=RoadSegmentResponse, tags=["Roads"])
def report_road_closure(
    payload: RoadClosureCreate,
    db: Session = Depends(get_db),
) -> RoadSegmentResponse:
    """
    Record or update an official road closure or lane restriction.
    Flags connected settlements as potentially isolated.
    """
    road = db.query(RoadSegment).filter(RoadSegment.id == payload.road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail=f"Road segment {payload.road_id} not found")

    road.status = payload.status.value
    road.closure_reason = payload.closure_reason
    road.affected_from = payload.affected_from or datetime.now(timezone.utc)
    road.estimated_clearance = payload.estimated_clearance
    road.alternate_route_available = payload.alternate_route_available

    # Update settlement isolation status if road is fully closed
    if road.status == "closed" and road.affected_settlements_json:
        try:
            affected_ids = json.loads(road.affected_settlements_json)
            for set_id in affected_ids:
                settlement = db.query(Settlement).filter(Settlement.id == set_id).first()
                if settlement and not settlement.is_isolated:
                    settlement.is_isolated = True
                    settlement.isolated_since = road.affected_from
        except Exception:
            pass

    audit = AuditLog(
        action="road_closure_updated",
        entity_type="road_segment",
        entity_id=road.id,
        performed_by="field_officer_pwd",
        details_json=json.dumps({
            "status": road.status,
            "reason": road.closure_reason,
            "alternate_available": road.alternate_route_available,
        }),
    )
    db.add(audit)

    db.commit()
    db.refresh(road)
    return road_to_response(road)
