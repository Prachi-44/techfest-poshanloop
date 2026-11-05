"""
POSHANLOOP API - Master Backend Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_tables, SessionLocal
from app.seed import seed_database
from app.api import (
    overview_router,
    children_router,
    trust_gate_router,
    blindspot_router,
    referrals_router,
    facility_router,
    sync_router,
    cause_finder_router,
    audit_router,
    demo_router,
)

app = FastAPI(
    title="POSHANLOOP API",
    description=(
        "Operational continuity and last-mile maternal and early-childhood "
        "nutrition follow-up system for the India @ 71/100 Challenge."
    ),
    version="1.0.0",
)

# Enable CORS for local development with frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Create database tables and populate with synthetic scenario data on launch."""
    create_tables()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "POSHANLOOP API",
        "environment": "local_prototype",
        "data_mode": "synthetic_only",
    }


# Include all modular API routers
app.include_router(overview_router, prefix="/api")
app.include_router(children_router, prefix="/api")
app.include_router(trust_gate_router, prefix="/api")
app.include_router(blindspot_router, prefix="/api")
app.include_router(referrals_router, prefix="/api")
app.include_router(facility_router, prefix="/api")
app.include_router(sync_router, prefix="/api")
app.include_router(cause_finder_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(demo_router, prefix="/api")

