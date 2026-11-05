"""CauseFinder schemas."""
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel


class ChecklistItemResponse(BaseModel):
    id: str
    category: str
    question: str
    info_card: str


class CauseFinderChecklistResponse(BaseModel):
    items: List[ChecklistItemResponse]
    disclaimer: str = (
        "This checklist is a decision-support tool. It does not replace clinical "
        "judgment. All suggested actions should be reviewed by qualified health workers."
    )


class CauseFinderSessionCreate(BaseModel):
    child_id: str
    worker_role: str
    worker_name: str
    checklist_responses: Dict[str, bool]  # item_id -> True/False


class CauseFinderSessionResponse(BaseModel):
    id: str
    child_id: str
    worker_role: str
    worker_name: str
    checklist_responses: Dict[str, Any]
    suggested_actions: List[str]
    disclaimer_shown: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
