from pydantic import BaseModel, Field
from typing import Optional, Any, Generic, TypeVar, List
from enum import Enum
from datetime import datetime

T = TypeVar("T")


class IncidentStatus(str, Enum):
    REPORTED = "reported"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    MERGED = "merged"
    CLOSED = "closed"


class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentType(str, Enum):
    ROAD_BLOCK = "road_block"
    FLOOD = "flood"
    LANDSLIDE = "landslide"
    AVALANCHE = "avalanche"
    BRIDGE_DAMAGE = "bridge_damage"
    OTHER = "other"


class IncidentSource(str, Enum):
    CITIZEN_APP = "citizen_app"
    FIELD_OFFICER = "field_officer"
    SOCIAL_MEDIA = "social_media"
    NGO = "ngo"
    DDMA = "ddma"


class RoadStatus(str, Enum):
    OPEN = "open"
    PARTIALLY_OPEN = "partially_open"
    CLOSED = "closed"
    UNKNOWN = "unknown"


class ReliefPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReliefStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ALLOCATED = "allocated"
    DELIVERED = "delivered"
    REJECTED = "rejected"


class DeliveryStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"


class GeoPoint(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime
    service: str = "AAPDA Grid API Core"


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    limit: int
    offset: int
