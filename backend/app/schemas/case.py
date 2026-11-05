"""CaseEvent schemas."""
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel


class CaseEventResponse(BaseModel):
    id: str
    referral_id: str
    actor_role: str
    actor_name: str
    action: str
    note: Optional[str] = None
    timestamp: Optional[datetime] = None
    event_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class CaseEventListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[CaseEventResponse]
