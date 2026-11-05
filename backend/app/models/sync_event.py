"""SyncEvent model for offline-first sync."""
import datetime
import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON

from app.database import Base


class SyncEvent(Base):
    __tablename__ = "sync_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))  # idempotency key
    event_type = Column(String, nullable=False)
    event_data = Column(JSON, nullable=False)
    device_created_at = Column(DateTime, nullable=False)
    server_received_at = Column(DateTime, nullable=True)
    sync_status = Column(String, nullable=False, default="pending")
    conflict_data = Column(JSON, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
