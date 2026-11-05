from typing import Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import DemoUser
from app.api.deps import get_demo_role

router = APIRouter(prefix="/demo", tags=["Demo & Role Switcher"])


@router.get("/users")
def list_demo_users(db: Session = Depends(get_db)):
    """List available synthetic demo accounts for role switching."""
    users = db.query(DemoUser).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "role": u.role,
            "centre_id": u.centre_id,
            "block_id": u.block_id,
        }
        for u in users
    ]


@router.get("/current-role")
def get_current_role(role: str = Depends(get_demo_role)):
    """Inspect currently active demo role passed via X-Demo-Role header."""
    return {
        "role": role,
        "is_demo_role": True,
        "notice": "Role switching is a prototype demo feature, not production authentication.",
    }

