from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.trust_gate import TrustGateFlag
from app.models.child import Child
from app.models.measurement import Measurement
from app.services.trust_gate_service import TrustGateService
from app.schemas.trust_gate import TrustGateVerifyRequest, TrustGateFlagListResponse, TrustGateFlagResponse
from app.config import TRUST_GATE_CONFIG
from app.api.deps import require_roles

router = APIRouter(prefix="/trust-gate", tags=["Trust Gate"])


@router.get("/config")
def get_trust_gate_config():
    """Returns configuration thresholds with plain-language descriptions."""
    return TRUST_GATE_CONFIG


@router.get("/flags", response_model=TrustGateFlagListResponse)
def list_flags(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    centre_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List data quality flags with filters and pagination."""
    query = db.query(TrustGateFlag)

    if status:
        query = query.filter(TrustGateFlag.status == status)
    if severity:
        query = query.filter(TrustGateFlag.severity == severity)
    if centre_id:
        query = query.join(Child, TrustGateFlag.child_id == Child.id).filter(Child.centre_id == centre_id)

    total = query.count()
    flags = query.order_by(TrustGateFlag.created_at.desc()).offset(skip).limit(limit).all()

    return {"total": total, "skip": skip, "limit": limit, "items": flags}


@router.post("/{flag_id}/verify", response_model=TrustGateFlagResponse)
def verify_flag(
    flag_id: str,
    req: TrustGateVerifyRequest,
    role: str = Depends(require_roles(["AWW", "ASHA_ANM", "Supervisor"])),
    db: Session = Depends(get_db),
):
    """
    Verify or resolve a Trust Gate flag.
    If 'Corrected' is selected with corrected_value/unit, creates a linked correction record.
    The original measurement is preserved and never deleted.
    """
    try:
        flag = TrustGateService.verify_flag(
            db=db,
            flag_id=flag_id,
            status=req.status,
            reviewed_by=req.reviewed_by,
            resolution_note=req.resolution_note,
            corrected_value=req.corrected_value,
            corrected_unit=req.corrected_unit,
        )
        db.commit()
        db.refresh(flag)
        return flag
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to verify flag: {str(e)}")

