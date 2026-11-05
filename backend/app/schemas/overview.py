"""Overview schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    timestamp: Optional[datetime] = None
    type: str  # measurement, referral, flag, case_event
    description: str
    actor: Optional[str] = None
    child_id: Optional[str] = None


class OverviewResponse(BaseModel):
    total_children: int
    records_due: int  # children with overdue measurements
    trust_gate_flags: int  # flags needing review
    unknown_overdue: int  # children with unknown/overdue status
    open_referrals: int
    overdue_cases: int  # referrals past due_date
    confirmed_outcomes: int  # referrals with Outcome recorded or Closed
    recent_activity: List[RecentActivityItem]
