"""TrustGateFlag model."""
import datetime
import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Text

from app.database import Base


class TrustGateFlag(Base):
    __tablename__ = "trust_gate_flags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    measurement_id = Column(String, ForeignKey("measurements.id"), nullable=False)
    child_id = Column(String, ForeignKey("children.id"), nullable=False)
    rule_code = Column(String, nullable=False)
    rule_description = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # info, warning, critical
    source_field = Column(String, nullable=False)
    source_value = Column(String, nullable=True)
    recommended_action = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Needs review")
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    from sqlalchemy.orm import relationship
    measurement = relationship("Measurement", back_populates="trust_gate_flags")
    child = relationship("Child", back_populates="trust_gate_flags")
