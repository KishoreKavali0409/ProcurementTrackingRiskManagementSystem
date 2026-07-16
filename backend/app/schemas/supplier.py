from typing import Optional
from pydantic import Field
from .base import CamelModel

class SupplierCreate(CamelModel):
    name: str
    email: str
    phone: Optional[str] = ""
    category: Optional[str] = ""
    city: Optional[str] = ""
    rating: Optional[int] = Field(default=5, ge=1, le=5)

class SupplierResponse(CamelModel):
    id: str
    name: str
    email: str
    phone: str
    category: str
    city: str
    rating: int
    created_at: str
