from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.blindspot_service import BlindspotService

router = APIRouter(prefix="/blindspot", tags=["BlindSpot Coverage"])


@router.get("/coverage")
def get_coverage(
    block_id: Optional[str] = None,
    age_band: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get aggregated coverage visibility by centre and block.
    Distinguishes Confirmed Concern vs Unknown/Overdue vs Up to date.
    Aggregate counts only; never reveals sensitive personal addresses.
    """
    return BlindspotService.get_coverage(
        db=db,
        block_id=block_id,
        age_band=age_band,
        status_filter=status,
    )

