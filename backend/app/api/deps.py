"""
API Dependencies including Demo Role extraction and authorization.
"""
from typing import Optional, List
from fastapi import Header, HTTPException, status


def get_demo_role(x_demo_role: Optional[str] = Header(default="Supervisor")) -> str:
    """Extract demo role from X-Demo-Role header."""
    valid_roles = ["AWW", "ASHA_ANM", "Facility", "Supervisor"]
    if x_demo_role not in valid_roles:
        # Default to Supervisor for prototype convenience if unspecified or custom
        return x_demo_role
    return x_demo_role


def require_roles(allowed_roles: List[str]):
    """Enforce role permissions on specific endpoints."""
    def role_checker(x_demo_role: Optional[str] = Header(default="Supervisor")):
        role = get_demo_role(x_demo_role)
        if role not in allowed_roles and role != "Supervisor":  # Supervisor can access all
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action restricted: Role '{role}' does not have permission. Allowed: {allowed_roles}",
            )
        return role
    return role_checker

