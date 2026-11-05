from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.overview_service import OverviewService
from app.schemas.overview import OverviewResponse

router = APIRouter(prefix="/overview", tags=["Overview"])


@router.get("", response_model=OverviewResponse)
def get_overview(db: Session = Depends(get_db)):
    """Get system-wide overview statistics and recent activity."""
    return OverviewService.get_overview(db)

