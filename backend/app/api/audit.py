from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.case import CaseEvent
from app.models.referral import Referral

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("")
def get_audit_trail(
    referral_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Query the append-only action ledger across cases."""
    query = db.query(CaseEvent)
    if referral_id:
        query = query.filter(CaseEvent.referral_id == referral_id)
    if actor_role:
        query = query.filter(CaseEvent.actor_role == actor_role)

    total = query.count()
    events = query.order_by(CaseEvent.timestamp.desc()).offset(skip).limit(limit).all()

    items = []
    for ev in events:
        ref = db.query(Referral).filter(Referral.id == ev.referral_id).first()
        items.append({
            "id": ev.id,
            "referral_id": ev.referral_id,
            "care_receipt_ref": ref.care_receipt_ref if ref else None,
            "child_id": ref.child_id if ref else None,
            "actor_role": ev.actor_role,
            "actor_name": ev.actor_name,
            "action": ev.action,
            "note": ev.note,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
            "event_data": ev.event_data,
        })

    return {"total": total, "skip": skip, "limit": limit, "items": items}

