"""Common schemas used across the application."""
from typing import Any, List, Optional
from pydantic import BaseModel


class PaginatedResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[Any]


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
