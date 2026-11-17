from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from datetime import datetime, timezone

from app.core.config import settings
from app.database.connection import engine, SessionLocal
from app.database.base import Base
import app.models  # Ensure all SQLAlchemy models are registered before create_all
from app.database.seed import seed_database
from app.api.v1.router import api_router
from app.schemas.common import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed synthetic demo data if database is empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AAPDA Grid Backend API — AI-assisted disaster intelligence, mountain-road accessibility, "
        "and last-mile relief coordination for Jammu & Kashmir.\n\n"
        "**Operating Principle:** AI assists — humans decide. The AI system only recommends; "
        "it never automatically verifies incidents, issues public warnings, or authorizes allocations."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_info():
    """Root metadata endpoint."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "DEMO / SIMULATED",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_redirect():
    """Convenience alias for /api/v1/health."""
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        database="connected",
        timestamp=datetime.now(timezone.utc),
        service=settings.PROJECT_NAME,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
