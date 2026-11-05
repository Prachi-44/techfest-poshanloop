"""Measurement schemas."""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class MeasurementCreate(BaseModel):
    child_id: str
    measurement_type: str  # weight, height, muac
    value: float
    unit: Optional[str] = None
    measurement_date: Optional[datetime] = None
    recorded_by: str
    notes: Optional[str] = None


class MeasurementResponse(BaseModel):
    id: str
    child_id: str
    measurement_type: str
    value: float
    unit: Optional[str] = None
    measurement_date: Optional[datetime] = None
    recorded_by: str
    recorded_at: Optional[datetime] = None
    is_corrected: bool = False
    corrected_by_id: Optional[str] = None
    correction_reason: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}
