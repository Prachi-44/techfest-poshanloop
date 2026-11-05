"""TrustGateFlag schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class TrustGateFlagResponse(BaseModel):
    id: str
    measurement_id: str
    child_id: str
    rule_code: str
    rule_description: str
    severity: str
    source_field: str
    source_value: Optional[str] = None
    recommended_action: str
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TrustGateVerifyRequest(BaseModel):
    status: str  # Verified, Corrected, Clear, Re-measurement requested
    reviewed_by: str
    resolution_note: Optional[str] = None
    corrected_value: Optional[float] = None
    corrected_unit: Optional[str] = None


class TrustGateFlagListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[TrustGateFlagResponse]
