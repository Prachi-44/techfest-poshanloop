from app.api.overview import router as overview_router
from app.api.children import router as children_router
from app.api.trust_gate import router as trust_gate_router
from app.api.blindspot import router as blindspot_router
from app.api.referrals import router as referrals_router
from app.api.facility import router as facility_router
from app.api.sync import router as sync_router
from app.api.cause_finder import router as cause_finder_router
from app.api.audit import router as audit_router
from app.api.demo import router as demo_router

__all__ = [
    "overview_router",
    "children_router",
    "trust_gate_router",
    "blindspot_router",
    "referrals_router",
    "facility_router",
    "sync_router",
    "cause_finder_router",
    "audit_router",
    "demo_router",
]

