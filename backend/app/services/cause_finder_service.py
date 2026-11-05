"""
Cause Finder Service - Guided Family Conversation.

Purpose: Help frontline workers organize a supportive conversation, not diagnose a child.
Never recommends medicines, dosages, emergency treatments or clinical decisions.
"""
import uuid
import datetime
from typing import Dict, List, Any
from sqlalchemy.orm import Session

from app.models.cause_finder import CauseFinderSession
from app.config import CAUSE_FINDER_CHECKLIST, CAUSE_FINDER_ACTIONS
from app.schemas.cause_finder import CauseFinderSessionCreate


DISCLAIMER_TEXT = (
    "This is not a diagnosis or treatment recommendation. "
    "Clinical care decisions belong to qualified health professionals. "
    "This guided checklist organizes a supportive conversation to understand non-clinical family barriers."
)


class CauseFinderService:
    @staticmethod
    def get_checklist() -> Dict[str, Any]:
        return {
            "disclaimer": DISCLAIMER_TEXT,
            "items": CAUSE_FINDER_CHECKLIST,
        }

    @staticmethod
    def create_session(db: Session, data: CauseFinderSessionCreate) -> CauseFinderSession:
        suggested_actions = []

        for item_id, answered_positive in data.checklist_responses.items():
            if answered_positive:
                action = CAUSE_FINDER_ACTIONS.get(item_id)
                if action and action not in suggested_actions:
                    suggested_actions.append(action)

        if not suggested_actions:
            suggested_actions.append(
                "No immediate family barriers identified in this conversation. Continue routine monthly Anganwadi growth monitoring."
            )

        session = CauseFinderSession(
            id=str(uuid.uuid4()),
            child_id=data.child_id,
            worker_role=data.worker_role,
            worker_name=data.worker_name,
            checklist_responses=data.checklist_responses,
            suggested_actions=suggested_actions,
            disclaimer_shown=True,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_child_sessions(db: Session, child_id: str) -> List[CauseFinderSession]:
        return db.query(CauseFinderSession).filter(
            CauseFinderSession.child_id == child_id
        ).order_by(CauseFinderSession.created_at.desc()).all()

