from fastapi import APIRouter, HTTPException
from typing import List
from ..db import supabase
from ..schemas.supplier import SupplierCreate, SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

def map_db_supplier(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row.get("phone") or "",
        "category": row.get("category") or "",
        "city": row.get("city") or "",
        "rating": int(row.get("rating") or 5),
        "created_at": row.get("created_at") or ""
    }

@router.get("", response_model=List[SupplierResponse])
def get_suppliers():
    res = supabase.table('suppliers').select('*').order('name').execute()
    return [map_db_supplier(row) for row in res.data]

@router.get("/{id}", response_model=SupplierResponse)
def get_supplier(id: str):
    res = supabase.table('suppliers').select('*').eq('id', id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return map_db_supplier(res.data[0])

@router.post("", response_model=SupplierResponse)
def create_supplier(supplier_in: SupplierCreate):
    db_supplier = {
        "name": supplier_in.name,
        "email": supplier_in.email,
        "phone": supplier_in.phone,
        "category": supplier_in.category,
        "city": supplier_in.city,
        "rating": supplier_in.rating
    }
    res = supabase.table('suppliers').insert(db_supplier).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create supplier")
    return map_db_supplier(res.data[0])

@router.delete("/{id}")
def delete_supplier(id: str):
    res = supabase.table('suppliers').delete().eq('id', id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"status": "success"}
