from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from ..db import supabase

router = APIRouter(prefix="/notifications", tags=["notifications"])

from ..schemas.base import CamelModel

# Pydantic schemas
class NotificationResponse(CamelModel):
    id: str
    user_id: Optional[str] = None
    case_id: Optional[str] = None
    type: str
    title: str
    message: Optional[str] = ""
    read: bool
    created_at: str

def create_notification(noti_type: str, title: str, message: str, case_id: str = None):
    try:
        supabase.table('notifications').insert({
            "type": noti_type,
            "title": title,
            "message": message,
            "case_id": case_id,
            "read": False
        }).execute()
    except Exception as e:
        print(f"Failed to create notification in DB: {e}")

def map_db_notification(row: dict) -> dict:
    return {
        "id": row["id"],
        "user_id": row.get("user_id"),
        "case_id": row.get("case_id"),
        "type": row["type"],
        "title": row["title"],
        "message": row.get("message") or "",
        "read": bool(row.get("read", False)),
        "created_at": row.get("created_at") or ""
    }

@router.get("", response_model=List[NotificationResponse])
def get_notifications():
    res = supabase.table('notifications').select('*').order('created_at', desc=True).limit(20).execute()
    return [map_db_notification(row) for row in res.data]

@router.put("/{id}/read")
def mark_read(id: str):
    res = supabase.table('notifications').update({"read": True}).eq('id', id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

@router.post("/clear")
def clear_notifications():
    # Fetch all to delete
    res = supabase.table('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    return {"status": "success"}
