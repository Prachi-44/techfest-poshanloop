from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.child import Child
from app.services.referral_service import ReferralService
from app.api.deps import require_roles

router = APIRouter(prefix="/facility", tags=["Facility Desk"])


class FacilityAcknowledgeByRefRequest(BaseModel):
    care_receipt_ref: str
    facility_status: str  # Received, Attended, Rescheduled, Not reached, Wrong facility
    recorded_by: str
    notes: Optional[str] = None


@router.get("/lookup")
def lookup_referral_by_ref(
    ref: str = Query(..., description="Care Receipt Reference code (e.g. PL-7K4M2)"),
    db: Session = Depends(get_db),
):
    """Find a synthetic referral by its Care Receipt Reference."""
    referral = ReferralService.get_by_care_receipt(db, ref)
    if not referral:
        raise HTTPException(status_code=404, detail=f"No active referral found matching Care Receipt Reference '{ref}'")

    child = db.query(Child).filter(Child.id == referral.child_id).first()

    return {
        "id": referral.id,
        "care_receipt_ref": referral.care_receipt_ref,
        "child_id": referral.child_id,
        "child_name": child.name if child else "Unknown Child",
        "age_months": child.age_months if child else None,
        "gender": child.gender if child else None,
        "guardian_name": child.guardian_name if child else None,
        "status": referral.status,
        "destination_facility": referral.destination_facility,
        "visit_instruction": referral.visit_instruction,
        "priority": referral.priority,
        "barriers": referral.barriers or [],
        "facility_status": referral.facility_status,
        "facility_recorded_by": referral.facility_recorded_by,
        "facility_recorded_at": referral.facility_recorded_at.isoformat() if referral.facility_recorded_at else None,
    }


@router.post("/acknowledge")
def acknowledge_by_ref(
    req: FacilityAcknowledgeByRefRequest,
    role: str = Depends(require_roles(["Facility", "Supervisor"])),
    db: Session = Depends(get_db),
):
    """Record receipt or outcome using the Care Receipt reference token."""
    referral = ReferralService.get_by_care_receipt(db, req.care_receipt_ref)
    if not referral:
        raise HTTPException(status_code=404, detail=f"Referral with reference '{req.care_receipt_ref}' not found")

    referral = ReferralService.facility_acknowledgement(
        db=db,
        referral_id=referral.id,
        facility_status=req.facility_status,
        recorded_by=req.recorded_by,
        notes=req.notes,
    )

    return {
        "status": "success",
        "care_receipt_ref": referral.care_receipt_ref,
        "facility_status": referral.facility_status,
        "case_status": referral.status,
    }

