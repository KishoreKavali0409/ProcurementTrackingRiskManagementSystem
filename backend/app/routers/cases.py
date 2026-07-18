from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from datetime import datetime
from ..db import supabase
from ..schemas.case import CaseCreate, CaseUpdate, CaseResponse, CaseUpdateSchema
from ..schemas.supplier import SupplierResponse
from .notifications import create_notification

router = APIRouter(prefix="/cases", tags=["cases"])

DOCUMENT_TYPES = [
    'RFQ', 'Vendor Quotes', 'Comparative Analysis', 'Approval Form',
    'Contract Draft', 'Final Contract', 'PO Copy'
]

def map_db_case(row: dict) -> dict:
    documents = {doc: False for doc in DOCUMENT_TYPES}
    for doc_item in row.get('document_checklist', []):
        documents[doc_item['doc_type']] = doc_item['received']
        
    updates = []
    for u in row.get('case_updates', []):
        updates.append({
            'date': u['created_at'].split('T')[0] if u.get('created_at') else "",
            'text': u['text'],
            'author': u['author']
        })
    updates.sort(key=lambda x: x['date'])
    
    return {
        'id': row['id'],
        'title': row['title'],
        'category': row['category'],
        'department': row['department'],
        'requester': row['requester'],
        'assignedTo': row['assigned_to'],
        'priority': row['priority'],
        'status': row['status'],
        'vendor': row.get('vendor') or "",
        'estimatedValue': float(row.get('estimated_value') or 0.0),
        'approvedBudget': float(row.get('approved_budget') or 0.0),
        'currency': row.get('currency') or "INR",
        'openedDate': row['opened_date'],
        'expectedClosure': row.get('expected_closure') or "",
        'lastUpdated': row.get('last_updated') or row['opened_date'],
        'description': row.get('description') or "",
        'documents': documents,
        'updates': updates,
        'tags': row.get('tags') or [],
        'budgetCategory': row.get('budget_category') or "standard"
    }

def generate_case_id() -> str:
    year = datetime.now().year
    res = supabase.table('cases').select('id').execute()
    existing_ids = [r['id'] for r in res.data if r['id'].startswith(f"PC-{year}-")]
    nums = []
    for cid in existing_ids:
        try:
            nums.append(int(cid.split('-')[2]))
        except (IndexError, ValueError):
            continue
    next_num = max(nums) + 1 if nums else 1
    return f"PC-{year}-{str(next_num).zfill(3)}"

@router.get("", response_model=List[CaseResponse])
def get_cases():
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').execute()
    return [map_db_case(row) for row in res.data]

@router.get("/{id}", response_model=CaseResponse)
def get_case(id: str):
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').eq('id', id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Case not found")
    return map_db_case(res.data[0])

@router.post("", response_model=CaseResponse)
def create_case(case_in: CaseCreate):
    new_id = generate_case_id()
    today_str = datetime.now().date().isoformat()
    
    # 1. Insert case
    db_case = {
        "id": new_id,
        "title": case_in.title,
        "category": case_in.category,
        "department": case_in.department,
        "requester": case_in.requester,
        "assigned_to": case_in.assigned_to,
        "priority": case_in.priority,
        "status": case_in.status,
        "vendor": case_in.vendor,
        "estimated_value": case_in.estimated_value,
        "approved_budget": case_in.approved_budget,
        "currency": case_in.currency,
        "description": case_in.description,
        "opened_date": case_in.opened_date or today_str,
        "expected_closure": case_in.expected_closure or None,
        "last_updated": today_str,
        "tags": case_in.tags or [],
        "budget_category": case_in.budget_category or "standard"
    }
    
    res = supabase.table('cases').insert(db_case).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create case")
        
    # 2. Insert document checklist
    checklist_rows = []
    docs_payload = case_in.documents or {}
    for doc in DOCUMENT_TYPES:
        checklist_rows.append({
            "case_id": new_id,
            "doc_type": doc,
            "received": docs_payload.get(doc, False)
        })
    supabase.table('document_checklist').insert(checklist_rows).execute()
    
    # 3. Log initial update note
    supabase.table('case_updates').insert({
        "case_id": new_id,
        "text": "Case created.",
        "author": case_in.assigned_to or "System"
    }).execute()
    
    # 4. Trigger global notification
    create_notification(
        "status_change", 
        f"Case Created: {new_id}", 
        f"New case has been opened: '{case_in.title}' (Assigned: {case_in.assigned_to or 'Unassigned'}).", 
        new_id
    )
    
    # Fetch complete case to return
    full_res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').eq('id', new_id).execute()
    return map_db_case(full_res.data[0])

@router.put("/{id}")
def update_case(id: str, case_in: CaseUpdate):
    # Check if case exists and fetch current status & assigned_to for transition logging
    chk = supabase.table('cases').select('id, status, assigned_to').eq('id', id).execute()
    if not chk.data:
        raise HTTPException(status_code=404, detail="Case not found")
        
    old_status = chk.data[0].get('status')
    assigned_to = chk.data[0].get('assigned_to') or "System"
    today_str = datetime.now().date().isoformat()
    
    # 1. Update cases table
    db_update = {}
    if case_in.title is not None: db_update["title"] = case_in.title
    if case_in.category is not None: db_update["category"] = case_in.category
    if case_in.department is not None: db_update["department"] = case_in.department
    if case_in.requester is not None: db_update["requester"] = case_in.requester
    if case_in.assigned_to is not None: db_update["assigned_to"] = case_in.assigned_to
    if case_in.priority is not None: db_update["priority"] = case_in.priority
    if case_in.status is not None: db_update["status"] = case_in.status
    if case_in.vendor is not None: db_update["vendor"] = case_in.vendor
    if case_in.estimated_value is not None: db_update["estimated_value"] = case_in.estimated_value
    if case_in.approved_budget is not None: db_update["approved_budget"] = case_in.approved_budget
    if case_in.currency is not None: db_update["currency"] = case_in.currency
    if case_in.description is not None: db_update["description"] = case_in.description
    if case_in.expected_closure is not None: db_update["expected_closure"] = case_in.expected_closure or None
    if case_in.tags is not None: db_update["tags"] = case_in.tags
    if case_in.budget_category is not None: db_update["budget_category"] = case_in.budget_category
    
    db_update["last_updated"] = today_str
    
    if db_update:
        supabase.table('cases').update(db_update).eq('id', id).execute()
        
    # 2. Log status transition if status changed
    if case_in.status is not None and case_in.status != old_status:
        supabase.table('case_updates').insert({
            "case_id": id,
            "text": f"Status transitioned from '{old_status}' to '{case_in.status}'.",
            "author": assigned_to
        }).execute()
        create_notification(
            "status_change", 
            f"Status Updated: {id}", 
            f"Case transitioned to '{case_in.status}' (previously '{old_status}').", 
            id
        )
        
    # 3. Update document checklist
    if case_in.documents is not None:
        checklist_upserts = []
        for doc_type, received in case_in.documents.items():
            checklist_upserts.append({
                "case_id": id,
                "doc_type": doc_type,
                "received": received
            })
        if checklist_upserts:
            supabase.table('document_checklist').upsert(checklist_upserts, on_conflict="case_id,doc_type").execute()
            
    return {"status": "success"}

@router.delete("/{id}")
def delete_case(id: str):
    res = supabase.table('cases').delete().eq('id', id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"status": "success"}

@router.post("/{id}/updates")
def add_update(id: str, update_in: Dict[str, str]):
    text = update_in.get("text")
    author = update_in.get("author")
    if not text or not author:
        raise HTTPException(status_code=400, detail="Missing text or author")
        
    # 1. Insert update
    res = supabase.table('case_updates').insert({
        "case_id": id,
        "text": text,
        "author": author
    }).execute()
    
    # 2. Update case timestamp
    today_str = datetime.now().date().isoformat()
    supabase.table('cases').update({"last_updated": today_str}).eq('id', id).execute()
    
    return {"status": "success"}

@router.post("/{id}/bidders")
def set_bidders(id: str, payload: Dict[str, List[str]]):
    supplier_ids = payload.get("supplierIds")
    if supplier_ids is None:
        raise HTTPException(status_code=400, detail="Missing supplierIds")
        
    # 1. Clear existing bidders
    supabase.table('case_suppliers').delete().eq('case_id', id).execute()
    
    # 2. Add new bidders
    if supplier_ids:
        junction_rows = [{"case_id": id, "supplier_id": sid} for sid in supplier_ids]
        supabase.table('case_suppliers').insert(junction_rows).execute()
        
    # Update stage automatically to "Bidders Defined" if currently at "RFQ Draft"
    case_res = supabase.table('cases').select('status').eq('id', id).execute()
    if case_res.data and case_res.data[0]['status'] == 'RFQ Draft':
        today_str = datetime.now().date().isoformat()
        supabase.table('cases').update({
            "status": "Bidders Defined",
            "last_updated": today_str
        }).eq('id', id).execute()
        
        # Log update note
        supabase.table('case_updates').insert({
            "case_id": id,
            "text": f"Bidders defined: {len(supplier_ids)} suppliers assigned.",
            "author": "System"
        }).execute()
        create_notification(
            "status_change", 
            f"Bidders Defined: {id}", 
            f"{len(supplier_ids)} suppliers have been assigned as bidders.", 
            id
        )
        
    return {"status": "success"}

@router.get("/{id}/bidders", response_model=List[SupplierResponse])
def get_bidders(id: str):
    res = supabase.table('case_suppliers').select('supplier_id, suppliers(*)').eq('case_id', id).execute()
    suppliers_list = []
    for item in res.data:
        supplier_raw = item.get('suppliers')
        if supplier_raw:
            suppliers_list.append(supplier_raw)
    return suppliers_list
