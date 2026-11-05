"""CauseFinderSession model."""
import datetime
import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON, Boolean

from app.database import Base


class CauseFinderSession(Base):
    __tablename__ = "cause_finder_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("children.id"), nullable=False)
    worker_role = Column(String, nullable=False)
    worker_name = Column(String, nullable=False)
    checklist_responses = Column(JSON, nullable=False)  # dict of item_id -> bool
    suggested_actions = Column(JSON, nullable=False)  # list of action strings
    disclaimer_shown = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    from sqlalchemy.orm import relationship
    child = relationship("Child", back_populates="cause_finder_sessions")
