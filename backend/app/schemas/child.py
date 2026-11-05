"""Child, Centre, Block schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class BlockResponse(BaseModel):
    id: str
    name: str
    district: str

    model_config = {"from_attributes": True}


class CentreResponse(BaseModel):
    id: str
    name: str
    block_id: str

    model_config = {"from_attributes": True}


class ChildCreate(BaseModel):
    name: str
    age_months: int
    gender: str
    centre_id: str
    guardian_name: str
    status: str = "active"


class ChildResponse(BaseModel):
    id: str
    name: str
    age_months: int
    gender: str
    centre_id: str
    guardian_name: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChildDetailResponse(BaseModel):
    id: str
    name: str
    age_months: int
    gender: str
    centre_id: str
    guardian_name: str
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    centre: Optional[CentreResponse] = None
    measurements: List[dict] = []
    trust_gate_flags: List[dict] = []
    referrals: List[dict] = []

    model_config = {"from_attributes": True}


class ChildListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[ChildResponse]
