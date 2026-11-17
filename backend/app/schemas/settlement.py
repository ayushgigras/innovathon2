from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.common import GeoPoint


class NearestFacilitySchema(BaseModel):
    name: str
    type: str
    distance_km: float


class SettlementBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    district: str
    population: int = Field(..., ge=0)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)


class SettlementCreate(SettlementBase):
    is_isolated: bool = False
    isolated_since: Optional[datetime] = None
    access_roads: List[str] = []
    nearest_facility: Optional[NearestFacilitySchema] = None


class SettlementResponse(SettlementBase):
    id: str
    location: GeoPoint
    is_isolated: bool
    isolated_since: Optional[datetime] = None
    access_roads: List[str] = []
    nearest_facility: Optional[NearestFacilitySchema] = None
    is_simulated: bool = True
    created_at: datetime

    class Config:
        from_attributes = True
