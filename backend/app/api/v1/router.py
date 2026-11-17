from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    incidents,
    verification,
    roads,
    routes,
    settlements,
    relief,
    public,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(incidents.router, prefix="/incidents")
api_router.include_router(verification.router, prefix="/verification")
api_router.include_router(roads.router, prefix="/roads")
api_router.include_router(routes.router, prefix="/routes")
api_router.include_router(settlements.router, prefix="/settlements")
api_router.include_router(relief.router, prefix="/relief")
api_router.include_router(public.router, prefix="/public")
