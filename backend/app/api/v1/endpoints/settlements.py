import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.settlement import Settlement
from app.schemas.settlement import SettlementResponse, NearestFacilitySchema
from app.schemas.common import GeoPoint

router = APIRouter()


def settlement_to_response(s: Settlement) -> SettlementResponse:
    access_roads = []
    if s.access_roads_json:
        try:
            access_roads = json.loads(s.access_roads_json)
        except Exception:
            access_roads = []

    facility = None
    if s.nearest_facility_name:
        facility = NearestFacilitySchema(
            name=s.nearest_facility_name,
            type=s.nearest_facility_type or "hospital",
            distance_km=s.nearest_facility_distance_km or 5.0,
        )

    return SettlementResponse(
        id=s.id,
        name=s.name,
        district=s.district,
        population=s.population,
        lat=s.lat,
        lng=s.lng,
        location=GeoPoint(lat=s.lat, lng=s.lng),
        is_isolated=s.is_isolated,
        isolated_since=s.isolated_since,
        access_roads=access_roads,
        nearest_facility=facility,
        is_simulated=s.is_simulated,
        created_at=s.created_at,
    )


@router.get("", response_model=List[SettlementResponse], tags=["Settlements"])
def list_settlements(
    district: Optional[str] = None,
    isolated_only: bool = Query(False, description="Filter for isolated settlements cut off by road closures"),
    db: Session = Depends(get_db),
) -> List[SettlementResponse]:
    """Retrieve settlements with current road connectivity and isolation status."""
    query = db.query(Settlement)
    if district:
        query = query.filter(Settlement.district.ilike(f"%{district}%"))
    if isolated_only:
        query = query.filter(Settlement.is_isolated == True)

    settlements = query.all()
    return [settlement_to_response(s) for s in settlements]
