"""Child, Centre, and Block models."""
import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class Block(Base):
    __tablename__ = "blocks"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)

    centres = relationship("Centre", back_populates="block")
    users = relationship("DemoUser", back_populates="block")


class Centre(Base):
    __tablename__ = "centres"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=False)

    block = relationship("Block", back_populates="centres")
    children = relationship("Child", back_populates="centre")
    users = relationship("DemoUser", back_populates="centre")


class Child(Base):
    __tablename__ = "children"

    id = Column(String, primary_key=True)  # CH-0001 format
    name = Column(String, nullable=False)
    age_months = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    centre_id = Column(String, ForeignKey("centres.id"), nullable=False)
    guardian_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    centre = relationship("Centre", back_populates="children")
    measurements = relationship("Measurement", back_populates="child", foreign_keys="Measurement.child_id")
    trust_gate_flags = relationship("TrustGateFlag", back_populates="child")
    referrals = relationship("Referral", back_populates="child")
    cause_finder_sessions = relationship("CauseFinderSession", back_populates="child")
