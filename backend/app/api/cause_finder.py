from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.cause_finder_service import CauseFinderService, DISCLAIMER_TEXT
from app.schemas.cause_finder import (
    CauseFinderChecklistResponse,
    CauseFinderSessionCreate,
    CauseFinderSessionResponse,
)

router = APIRouter(prefix="/cause-finder", tags=["Cause Finder - Guided Family Conversation"])


@router.get("/checklist", response_model=CauseFinderChecklistResponse)
def get_checklist():
    """Returns pre-written, admin-approved conversational checklist and non-clinical disclaimer."""
    return CauseFinderService.get_checklist()


@router.post("/session", response_model=CauseFinderSessionResponse)
def record_session(req: CauseFinderSessionCreate, db: Session = Depends(get_db)):
    """
    Save responses from a structured family conversation.
    Maps selected answers to administrative and supportive next steps.
    Never produces clinical diagnoses or treatment recommendations.
    """
    try:
        session = CauseFinderService.create_session(db, req)
        return session
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to record session: {str(e)}")


@router.get("/sessions/{child_id}", response_model=List[CauseFinderSessionResponse])
def get_child_sessions(child_id: str, db: Session = Depends(get_db)):
    """Retrieve previous guided conversation sessions for a child."""
    return CauseFinderService.get_child_sessions(db, child_id)

