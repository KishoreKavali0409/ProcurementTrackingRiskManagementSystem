from typing import List, Optional, Dict
from .base import CamelModel

class CaseUpdateSchema(CamelModel):
    date: str
    text: str
    author: str

class CaseCreate(CamelModel):
    title: str
    category: str
    department: str
    requester: str
    assigned_to: str
    priority: str
    status: str
    vendor: Optional[str] = ""
    estimated_value: float = 0.0
    approved_budget: float = 0.0
    currency: str = "INR"
    description: Optional[str] = ""
    opened_date: Optional[str] = None
    expected_closure: Optional[str] = ""
    tags: Optional[List[str]] = None
    documents: Optional[Dict[str, bool]] = None
    budget_category: Optional[str] = "standard"

class CaseUpdate(CamelModel):
    title: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    requester: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    vendor: Optional[str] = None
    estimated_value: Optional[float] = None
    approved_budget: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    expected_closure: Optional[str] = None
    tags: Optional[List[str]] = None
    documents: Optional[Dict[str, bool]] = None
    budget_category: Optional[str] = None

class CaseResponse(CamelModel):
    id: str
    title: str
    category: str
    department: str
    requester: str
    assigned_to: str
    priority: str
    status: str
    vendor: str
    estimated_value: float
    approved_budget: float
    currency: str
    opened_date: str
    expected_closure: str
    last_updated: str
    description: str
    documents: Dict[str, bool] = {}
    updates: List[CaseUpdateSchema] = []
    tags: List[str] = []
    budget_category: str = "standard"
