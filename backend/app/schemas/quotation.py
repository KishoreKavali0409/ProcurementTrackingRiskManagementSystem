from typing import Optional
from .base import CamelModel
from .supplier import SupplierResponse

class QuotationCreate(CamelModel):
    case_id: str
    supplier_id: str
    unit_price: float = 0.0
    total_price: float = 0.0
    delivery_days: int = 0
    payment_terms: Optional[str] = ""
    notes: Optional[str] = ""

class QuotationResponse(CamelModel):
    id: str
    case_id: str
    supplier_id: str
    unit_price: float
    total_price: float
    delivery_days: int
    payment_terms: str
    notes: str
    submitted_at: str
    supplier: Optional[SupplierResponse] = None
