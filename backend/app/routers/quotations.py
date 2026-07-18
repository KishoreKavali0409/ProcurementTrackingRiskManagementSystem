from fastapi import APIRouter, HTTPException
from typing import List, Dict
from datetime import datetime
from ..db import supabase
from ..schemas.quotation import QuotationCreate, QuotationResponse
from .notifications import create_notification

router = APIRouter(prefix="/quotations", tags=["quotations"])

def map_db_quotation(row: dict) -> dict:
    supplier_raw = row.get("suppliers")
    supplier_mapped = None
    if supplier_raw:
        supplier_mapped = {
            "id": supplier_raw["id"],
            "name": supplier_raw["name"],
            "email": supplier_raw["email"],
            "phone": supplier_raw.get("phone") or "",
            "category": supplier_raw.get("category") or "",
            "city": supplier_raw.get("city") or "",
            "rating": int(supplier_raw.get("rating") or 5),
            "createdAt": supplier_raw.get("created_at") or ""
        }
    return {
        "id": row["id"],
        "caseId": row["case_id"],
        "supplierId": row["supplier_id"],
        "unitPrice": float(row.get("unit_price") or 0.0),
        "totalPrice": float(row.get("total_price") or 0.0),
        "deliveryDays": int(row.get("delivery_days") or 0),
        "paymentTerms": row.get("payment_terms") or "",
        "notes": row.get("notes") or "",
        "submittedAt": row.get("submitted_at") or "",
        "supplier": supplier_mapped
    }

@router.get("/case/{case_id}", response_model=List[QuotationResponse])
def get_case_quotations(case_id: str):
    res = supabase.table('quotations').select('*, suppliers(*)').eq('case_id', case_id).execute()
    return [map_db_quotation(row) for row in res.data]

@router.post("", response_model=QuotationResponse)
def create_quotation(quote_in: QuotationCreate):
    db_quote = {
        "case_id": quote_in.case_id,
        "supplier_id": quote_in.supplier_id,
        "unit_price": quote_in.unit_price,
        "total_price": quote_in.total_price,
        "delivery_days": quote_in.delivery_days,
        "payment_terms": quote_in.payment_terms,
        "notes": quote_in.notes
    }
    
    # 1. Insert quotation
    res = supabase.table('quotations').insert(db_quote).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to submit quotation")
        
    # Fetch supplier details to log update note and return full response
    q_id = res.data[0]["id"]
    full_res = supabase.table('quotations').select('*, suppliers(*)').eq('id', q_id).execute()
    mapped_quote = map_db_quotation(full_res.data[0])
    
    supplier_name = mapped_quote["supplier"]["name"] if mapped_quote.get("supplier") else "Supplier"
    
    # 2. Advance case status automatically to "Offers Received" if currently in lower stage
    case_res = supabase.table('cases').select('status').eq('id', quote_in.case_id).execute()
    if case_res.data:
        current_status = case_res.data[0]['status']
        if current_status in ['RFQ Draft', 'Bidders Defined', 'RFQ Shared']:
            today_str = datetime.now().date().isoformat()
            supabase.table('cases').update({
                "status": "Offers Received",
                "last_updated": today_str
            }).eq('id', quote_in.case_id).execute()
            
            # Log status change in updates timeline
            supabase.table('case_updates').insert({
                "case_id": quote_in.case_id,
                "text": f"Offers Received: Quotation submitted by {supplier_name} for ₹{quote_in.total_price:,.2f}.",
                "author": "System"
            }).execute()
            create_notification(
                "status_change", 
                f"Offers Received: {quote_in.case_id}", 
                f"Quotation submitted by {supplier_name} for ₹{quote_in.total_price:,.2f}.", 
                quote_in.case_id
            )
        else:
            # Just log the additional quotation submission
            supabase.table('case_updates').insert({
                "case_id": quote_in.case_id,
                "text": f"New quote submitted by {supplier_name} for ₹{quote_in.total_price:,.2f}.",
                "author": "System"
            }).execute()
            create_notification(
                "status_change", 
                f"New Quotation: {quote_in.case_id}", 
                f"Quotation submitted by {supplier_name} for ₹{quote_in.total_price:,.2f}.", 
                quote_in.case_id
            )
            
    return mapped_quote
