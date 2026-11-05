"""DemoUser model for role-based demo access."""
from sqlalchemy import Column, String, Integer, ForeignKey

from app.database import Base


class DemoUser(Base):
    __tablename__ = "demo_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # AWW, ASHA_ANM, Facility, Supervisor
    centre_id = Column(String, ForeignKey("centres.id"), nullable=True)
    block_id = Column(String, ForeignKey("blocks.id"), nullable=True)

    from sqlalchemy.orm import relationship
    centre = relationship("Centre", back_populates="users")
    block = relationship("Block", back_populates="users")
