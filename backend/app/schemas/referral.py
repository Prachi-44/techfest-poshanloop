"""Referral schemas."""
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel


class ReferralCreate(BaseModel):
    child_id: str
    destination_facility: Optional[str] = None
    visit_instruction: Optional[str] = None
    expiry_date: Optional[datetime] = None
    assigned_to_role: Optional[str] = None
    assigned_to_name: Optional[str] = None
    priority: str = "routine"
    next_action: Optional[str] = None
    due_date: Optional[datetime] = None
    barriers: Optional[List[str]] = None
    barrier_notes: Optional[str] = None
    actor_role: str
    actor_name: str


class ReferralResponse(BaseModel):
    id: str
    child_id: str
    care_receipt_ref: str
    status: str
    destination_facility: Optional[str] = None
    visit_instruction: Optional[str] = None
    date_issued: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    barriers: Optional[List[str]] = None
    barrier_notes: Optional[str] = None
    assigned_to_role: Optional[str] = None
    assigned_to_name: Optional[str] = None
    priority: str
    next_action: Optional[str] = None
    due_date: Optional[datetime] = None
    facility_status: Optional[str] = None
    facility_recorded_by: Optional[str] = None
    facility_recorded_at: Optional[datetime] = None
    closure_reason: Optional[str] = None
    closed_by: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CaseEventResponseInline(BaseModel):
    id: str
    referral_id: str
    actor_role: str
    actor_name: str
    action: str
    note: Optional[str] = None
    timestamp: Optional[datetime] = None
    event_data: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class ReferralDetailResponse(ReferralResponse):
    events: List[CaseEventResponseInline] = []
    child: Optional[Dict[str, Any]] = None


class ReferralActionRequest(BaseModel):
    action: str
    actor_role: str
    actor_name: str
    note: Optional[str] = None
    new_status: Optional[str] = None
    barriers: Optional[List[str]] = None
    barrier_notes: Optional[str] = None
    assigned_to_role: Optional[str] = None
    assigned_to_name: Optional[str] = None
    next_action: Optional[str] = None
    due_date: Optional[datetime] = None
    closure_reason: Optional[str] = None
    facility_status: Optional[str] = None
    event_data: Optional[Dict[str, Any]] = None


class FacilityAcknowledgementRequest(BaseModel):
    facility_status: str
    recorded_by: str
    notes: Optional[str] = None


class CareReceiptResponse(BaseModel):
    care_receipt_ref: str
    child_id: str
    child_name: str
    destination_facility: Optional[str] = None
    visit_instruction: Optional[str] = None
    date_issued: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    priority: str
    status: str
    barriers: Optional[List[str]] = None


class ReferralListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[ReferralResponse]
