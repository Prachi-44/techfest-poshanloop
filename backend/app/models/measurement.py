"""Measurement model."""
import datetime
import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String, ForeignKey("children.id"), nullable=False)
    measurement_type = Column(String, nullable=False)  # weight, height, muac
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=True)
    measurement_date = Column(DateTime, nullable=True)
    recorded_by = Column(String, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_corrected = Column(Boolean, default=False)
    corrected_by_id = Column(String, ForeignKey("measurements.id"), nullable=True)
    correction_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    child = relationship("Child", back_populates="measurements")
    trust_gate_flags = relationship("TrustGateFlag", back_populates="measurement")
    correction = relationship("Measurement", remote_side="Measurement.id", foreign_keys=[corrected_by_id])
