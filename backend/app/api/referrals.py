from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.child import Child
from app.services.referral_service import ReferralService
from app.schemas.referral import (
    ReferralCreate,
    ReferralResponse,
    ReferralDetailResponse,
    ReferralActionRequest,
    FacilityAcknowledgementRequest,
    CareReceiptResponse,
)
from app.api.deps import require_roles

router = APIRouter(prefix="/referrals", tags=["Referrals & Action-to-Closure Ledger"])


@router.get("")
def list_referrals(
    status: Optional[str] = None,
    assigned_to_role: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List referrals with filters, pagination, and child information."""
    referrals, total = ReferralService.list_referrals(
        db=db,
        status=status,
        assigned_to_role=assigned_to_role,
        priority=priority,
        search=search,
        skip=skip,
        limit=limit,
    )

    items = []
    for r in referrals:
        child = db.query(Child).filter(Child.id == r.child_id).first()
        items.append({
            "id": r.id,
            "child_id": r.child_id,
            "child_name": child.name if child else "Unknown Child",
            "care_receipt_ref": r.care_receipt_ref,
            "status": r.status,
            "destination_facility": r.destination_facility,
            "visit_instruction": r.visit_instruction,
            "date_issued": r.date_issued.isoformat() if r.date_issued else None,
            "expiry_date": r.expiry_date.isoformat() if r.expiry_date else None,
            "barriers": r.barriers or [],
            "barrier_notes": r.barrier_notes,
            "assigned_to_role": r.assigned_to_role,
            "assigned_to_name": r.assigned_to_name,
            "priority": r.priority,
            "next_action": r.next_action,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "facility_status": r.facility_status,
            "facility_recorded_by": r.facility_recorded_by,
            "facility_recorded_at": r.facility_recorded_at.isoformat() if r.facility_recorded_at else None,
            "closure_reason": r.closure_reason,
            "closed_by": r.closed_by,
            "closed_at": r.closed_at.isoformat() if r.closed_at else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        })

    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.post("", response_model=ReferralResponse)
def create_referral(
    req: ReferralCreate,
    role: str = Depends(require_roles(["AWW", "ASHA_ANM", "Supervisor"])),
    db: Session = Depends(get_db),
):
    """Create a new referral and generate a unique Care Receipt reference."""
    try:
        return ReferralService.create_referral(db, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create referral: {str(e)}")


@router.get("/{case_id}")
def get_referral_detail(case_id: str, db: Session = Depends(get_db)):
    """Get full case details including chronological audit trail and child context."""
    referral = ReferralService.get_referral(db, case_id)
    if not referral:
        raise HTTPException(status_code=404, detail=f"Referral {case_id} not found")

    child = db.query(Child).filter(Child.id == referral.child_id).first()

    events = [
        {
            "id": ev.id,
            "referral_id": ev.referral_id,
            "actor_role": ev.actor_role,
            "actor_name": ev.actor_name,
            "action": ev.action,
            "note": ev.note,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
            "event_data": ev.event_data,
        }
        for ev in referral.events
    ]

    return {
        "id": referral.id,
        "child_id": referral.child_id,
        "care_receipt_ref": referral.care_receipt_ref,
        "status": referral.status,
        "destination_facility": referral.destination_facility,
        "visit_instruction": referral.visit_instruction,
        "date_issued": referral.date_issued.isoformat() if referral.date_issued else None,
        "expiry_date": referral.expiry_date.isoformat() if referral.expiry_date else None,
        "barriers": referral.barriers or [],
        "barrier_notes": referral.barrier_notes,
        "assigned_to_role": referral.assigned_to_role,
        "assigned_to_name": referral.assigned_to_name,
        "priority": referral.priority,
        "next_action": referral.next_action,
        "due_date": referral.due_date.isoformat() if referral.due_date else None,
        "facility_status": referral.facility_status,
        "facility_recorded_by": referral.facility_recorded_by,
        "facility_recorded_at": referral.facility_recorded_at.isoformat() if referral.facility_recorded_at else None,
        "closure_reason": referral.closure_reason,
        "closed_by": referral.closed_by,
        "closed_at": referral.closed_at.isoformat() if referral.closed_at else None,
        "created_at": referral.created_at.isoformat() if referral.created_at else None,
        "updated_at": referral.updated_at.isoformat() if referral.updated_at else None,
        "child": {
            "id": child.id,
            "name": child.name,
            "age_months": child.age_months,
            "gender": child.gender,
            "centre_id": child.centre_id,
            "guardian_name": child.guardian_name,
        } if child else None,
        "events": events,
    }


@router.post("/{case_id}/actions")
def perform_action(
    case_id: str,
    req: ReferralActionRequest,
    db: Session = Depends(get_db),
):
    """
    Record an action on the referral case.
    Strictly validates case closure: A case cannot be closed solely because a reminder
    was sent. Must have a confirmed facility outcome or an authorized supervisor reason.
    """
    try:
        referral = ReferralService.perform_action(db, case_id, req)
        return {"status": "success", "referral_id": referral.id, "new_status": referral.status}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Action failed: {str(e)}")


@router.get("/{case_id}/care-receipt")
def get_care_receipt(case_id: str, db: Session = Depends(get_db)):
    """Generate printable Care Receipt hand-off slip."""
    try:
        return ReferralService.get_care_receipt_slip(db, case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{case_id}/facility-acknowledgement")
def facility_acknowledgement(
    case_id: str,
    req: FacilityAcknowledgementRequest,
    role: str = Depends(require_roles(["Facility", "Supervisor"])),
    db: Session = Depends(get_db),
):
    """Facility staff acknowledges arrival and records outcome (Attended / Rescheduled / etc.)."""
    try:
        referral = ReferralService.facility_acknowledgement(
            db=db,
            referral_id=case_id,
            facility_status=req.facility_status,
            recorded_by=req.recorded_by,
            notes=req.notes,
        )
        return {"status": "success", "case_id": referral.id, "facility_status": referral.facility_status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

