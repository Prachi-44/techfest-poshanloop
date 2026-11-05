"""CaseEvent model - append-only audit trail for referrals."""
import datetime
import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, JSON

from app.database import Base


class CaseEvent(Base):
    __tablename__ = "case_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referral_id = Column(String, ForeignKey("referrals.id"), nullable=False)
    actor_role = Column(String, nullable=False)
    actor_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_data = Column(JSON, nullable=True)

    from sqlalchemy.orm import relationship
    referral = relationship("Referral", back_populates="events")
