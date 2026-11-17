from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.common import RoadStatus, GeoPoint


class RoadClosureCreate(BaseModel):
    road_id: str
    status: RoadStatus = RoadStatus.CLOSED
    closure_reason: str = Field(..., min_length=3)
    affected_from: Optional[datetime] = None
    estimated_clearance: Optional[datetime] = None
    alternate_route_available: bool = False


class RoadSegmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    highway_ref: Optional[str] = None
    district: str
    status: RoadStatus = RoadStatus.OPEN
    lat_start: float = Field(..., ge=-90.0, le=90.0)
    lng_start: float = Field(..., ge=-180.0, le=180.0)
    lat_end: float = Field(..., ge=-90.0, le=90.0)
    lng_end: float = Field(..., ge=-180.0, le=180.0)


class RoadSegmentCreate(RoadSegmentBase):
    closure_reason: Optional[str] = None
    affected_from: Optional[datetime] = None
    estimated_clearance: Optional[datetime] = None
    coordinates: List[GeoPoint] = []
    affected_settlements: List[str] = []
    alternate_route_available: bool = False


class RoadSegmentResponse(RoadSegmentBase):
    id: str
    closure_reason: Optional[str] = None
    affected_from: Optional[datetime] = None
    estimated_clearance: Optional[datetime] = None
    coordinates: List[GeoPoint] = []
    affected_settlements: List[str] = []
    alternate_route_available: bool = False
    is_simulated: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RouteOption(BaseModel):
    route_id: str
    name: str
    distance_km: float
    estimated_time_minutes: int
    status: str
    passable: bool
    segments: List[str]
    disclaimer: str = "AI-suggested alternate route — confirm passability with field teams before dispatch"


class AlternativeRoutesResponse(BaseModel):
    origin: str
    destination: str
    blocked_road_id: Optional[str] = None
    direct_route_available: bool
    alternate_routes: List[RouteOption]
    generated_at: datetime
