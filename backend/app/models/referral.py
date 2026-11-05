"""Referral model - combines referral and case tracking."""
import datetime
import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, JSON

from app.database import Base


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("children.id"), nullable=False)
    care_receipt_ref = Column(String, unique=True, nullable=False)  # PL-XXXXX format

    status = Column(String, nullable=False, default="New")
    destination_facility = Column(String, nullable=True)
    visit_instruction = Column(Text, nullable=True)
    date_issued = Column(DateTime, default=datetime.datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)

    barriers = Column(JSON, nullable=True)  # list of barrier strings
    barrier_notes = Column(Text, nullable=True)

    assigned_to_role = Column(String, nullable=True)
    assigned_to_name = Column(String, nullable=True)
    priority = Column(String, nullable=False, default="routine")  # routine, urgent, high

    next_action = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)

    facility_status = Column(String, nullable=True)
    facility_recorded_by = Column(String, nullable=True)
    facility_recorded_at = Column(DateTime, nullable=True)

    closure_reason = Column(Text, nullable=True)
    closed_by = Column(String, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    from sqlalchemy.orm import relationship
    child = relationship("Child", back_populates="referrals")
    events = relationship("CaseEvent", back_populates="referral", order_by="CaseEvent.timestamp")
