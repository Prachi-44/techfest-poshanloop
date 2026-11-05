"""SyncEvent schemas."""
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel


class SyncEventCreate(BaseModel):
    id: str  # idempotency key / UUID
    event_type: str
    event_data: Dict[str, Any]
    device_created_at: datetime


class SyncEventBatchRequest(BaseModel):
    events: List[SyncEventCreate]


class SyncEventResponse(BaseModel):
    id: str
    event_type: str
    event_data: Dict[str, Any]
    device_created_at: Optional[datetime] = None
    server_received_at: Optional[datetime] = None
    sync_status: str
    conflict_data: Optional[Dict[str, Any]] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SyncEventResolveRequest(BaseModel):
    resolved_by: str
    resolution: str  # "keep_server" or "keep_device"


class SyncEventListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[SyncEventResponse]


class SyncBatchResultItem(BaseModel):
    id: str
    status: str  # "synced", "conflict", "error"
    message: Optional[str] = None


class SyncBatchResponse(BaseModel):
    results: List[SyncBatchResultItem]
