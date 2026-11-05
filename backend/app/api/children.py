from typing import Optional, List, Dict, Any
import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.child import Block, Centre, Child
from app.models.measurement import Measurement
from app.models.trust_gate import TrustGateFlag
from app.models.referral import Referral
from app.services.trust_gate_service import TrustGateService
from app.config import TRUST_GATE_CONFIG
from app.api.deps import require_roles

router = APIRouter(prefix="", tags=["Children & Geography"])


@router.get("/blocks")
def get_blocks(db: Session = Depends(get_db)):
    """List all administrative blocks."""
    blocks = db.query(Block).all()
    return [{"id": b.id, "name": b.name, "district": b.district} for b in blocks]


@router.get("/centres")
def get_centres(block_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List Anganwadi centres, optionally filtered by block."""
    query = db.query(Centre)
    if block_id:
        query = query.filter(Centre.block_id == block_id)
    centres = query.all()
    return [{"id": c.id, "name": c.name, "block_id": c.block_id} for c in centres]


@router.get("/children")
def list_children(
    centre_id: Optional[str] = None,
    block_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List synthetic children with filters, pagination, and data freshness calculation."""
    query = db.query(Child)

    if centre_id:
        query = query.filter(Child.centre_id == centre_id)
    elif block_id:
        query = query.join(Centre, Child.centre_id == Centre.id).filter(Centre.block_id == block_id)

    if status:
        query = query.filter(Child.status == status)

    if search:
        query = query.filter(
            or_(
                Child.id.ilike(f"%{search}%"),
                Child.name.ilike(f"%{search}%"),
                Child.guardian_name.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    children = query.order_by(Child.id).offset(skip).limit(limit).all()

    now = datetime.datetime.utcnow()
    schedule_days = TRUST_GATE_CONFIG["MEASUREMENT_SCHEDULE_DAYS"]["value"]

    items = []
    for c in children:
        # Check freshness
        latest_m = (
            db.query(Measurement)
            .filter(Measurement.child_id == c.id, Measurement.is_corrected == False, Measurement.measurement_date.isnot(None))
            .order_by(Measurement.measurement_date.desc())
            .first()
        )

        last_date = None
        data_freshness = "No data"
        days_since = None
        if latest_m and latest_m.measurement_date:
            last_date = latest_m.measurement_date.isoformat()
            days_since = (now - latest_m.measurement_date).days
            data_freshness = "Overdue" if days_since > schedule_days else "Up to date"

        centre = db.query(Centre).filter(Centre.id == c.centre_id).first()

        items.append({
            "id": c.id,
            "name": c.name,
            "age_months": c.age_months,
            "gender": c.gender,
            "centre_id": c.centre_id,
            "centre_name": centre.name if centre else c.centre_id,
            "guardian_name": c.guardian_name,
            "status": c.status,
            "last_measurement_date": last_date,
            "days_since_last_measurement": days_since,
            "data_freshness": data_freshness,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.get("/children/{child_id}")
def get_child_detail(child_id: str, db: Session = Depends(get_db)):
    """Get child detail including measurement history, trust gate flags, and active referrals."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail=f"Child {child_id} not found")

    centre = db.query(Centre).filter(Centre.id == child.centre_id).first()
    block = db.query(Block).filter(Block.id == centre.block_id).first() if centre else None

    # Measurements
    measurements = (
        db.query(Measurement)
        .filter(Measurement.child_id == child_id)
        .order_by(Measurement.recorded_at.desc())
        .all()
    )
    m_list = []
    for m in measurements:
        m_list.append({
            "id": m.id,
            "measurement_type": m.measurement_type,
            "value": m.value,
            "unit": m.unit,
            "measurement_date": m.measurement_date.isoformat() if m.measurement_date else None,
            "recorded_by": m.recorded_by,
            "recorded_at": m.recorded_at.isoformat() if m.recorded_at else None,
            "is_corrected": m.is_corrected,
            "corrected_by_id": m.corrected_by_id,
            "correction_reason": m.correction_reason,
            "notes": m.notes,
        })

    # Trust Gate Flags
    flags = (
        db.query(TrustGateFlag)
        .filter(TrustGateFlag.child_id == child_id)
        .order_by(TrustGateFlag.created_at.desc())
        .all()
    )
    f_list = []
    for f in flags:
        f_list.append({
            "id": f.id,
            "measurement_id": f.measurement_id,
            "rule_code": f.rule_code,
            "rule_description": f.rule_description,
            "severity": f.severity,
            "source_field": f.source_field,
            "source_value": f.source_value,
            "recommended_action": f.recommended_action,
            "status": f.status,
            "reviewed_by": f.reviewed_by,
            "reviewed_at": f.reviewed_at.isoformat() if f.reviewed_at else None,
            "resolution_note": f.resolution_note,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        })

    # Referrals
    referrals = (
        db.query(Referral)
        .filter(Referral.child_id == child_id)
        .order_by(Referral.created_at.desc())
        .all()
    )
    r_list = []
    for r in referrals:
        r_list.append({
            "id": r.id,
            "care_receipt_ref": r.care_receipt_ref,
            "status": r.status,
            "priority": r.priority,
            "destination_facility": r.destination_facility,
            "assigned_to_role": r.assigned_to_role,
            "assigned_to_name": r.assigned_to_name,
            "next_action": r.next_action,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        "id": child.id,
        "name": child.name,
        "age_months": child.age_months,
        "gender": child.gender,
        "centre_id": child.centre_id,
        "centre_name": centre.name if centre else "",
        "block_id": centre.block_id if centre else "",
        "block_name": block.name if block else "",
        "district": block.district if block else "",
        "guardian_name": child.guardian_name,
        "status": child.status,
        "measurements": m_list,
        "trust_gate_flags": f_list,
        "referrals": r_list,
    }


@router.post("/children/{child_id}/measurements")
def add_measurement(
    child_id: str,
    payload: Dict[str, Any],
    role: str = Depends(require_roles(["AWW", "ASHA_ANM", "Supervisor"])),
    db: Session = Depends(get_db),
):
    """Add a new growth measurement and run Trust Gate quality checks immediately."""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail=f"Child {child_id} not found")

    m_date = None
    if payload.get("measurement_date"):
        try:
            m_date = datetime.datetime.fromisoformat(payload["measurement_date"].replace("Z", "+00:00"))
        except Exception:
            m_date = None

    measurement = Measurement(
        id=str(uuid.uuid4()),
        child_id=child_id,
        measurement_type=payload.get("measurement_type", "weight"),
        value=float(payload.get("value", 0.0)),
        unit=payload.get("unit"),
        measurement_date=m_date,
        recorded_by=payload.get("recorded_by", f"Worker ({role})"),
        recorded_at=datetime.datetime.utcnow(),
        notes=payload.get("notes"),
    )
    db.add(measurement)
    db.flush()

    # Run Trust Gate validation rules
    created_flags = TrustGateService.run_all_rules(db, measurement)
    db.commit()

    return {
        "measurement_id": measurement.id,
        "child_id": child_id,
        "flags_triggered": len(created_flags),
        "flags": [
            {
                "id": f.id,
                "rule_code": f.rule_code,
                "severity": f.severity,
                "recommended_action": f.recommended_action,
            }
            for f in created_flags
        ],
    }

