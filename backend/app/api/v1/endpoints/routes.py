from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.road import RoadSegment
from app.schemas.road import AlternativeRoutesResponse
from app.services.margrakshak.routing import find_alternative_routes

router = APIRouter()


@router.get("/alternatives", response_model=AlternativeRoutesResponse, tags=["Routes"])
def get_alternative_routes(
    origin: str = Query("Ramban", description="Origin settlement or transit sector"),
    destination: str = Query("Srinagar", description="Destination sector"),
    blocked_road_id: Optional[str] = Query(None, description="Optional blocked road ID (e.g. RD-001)"),
    db: Session = Depends(get_db),
) -> AlternativeRoutesResponse:
    """
    Computes alternate mountain routes when primary highways or bridges are blocked.
    All returned routes are AI-suggested and require human field verification.
    """
    roads = db.query(RoadSegment).all()
    return find_alternative_routes(
        roads=roads,
        origin=origin,
        destination=destination,
        blocked_road_id=blocked_road_id,
    )
