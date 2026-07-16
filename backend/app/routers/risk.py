from fastapi import APIRouter, HTTPException
from typing import List, Dict
from ..db import supabase
from .cases import map_db_case
from ..services.risk_engine import compute_case_risks

router = APIRouter(prefix="/risk", tags=["risk"])

@router.get("/case/{case_id}")
def get_case_risks_endpoint(case_id: str):
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').eq('id', case_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Case not found")
    mapped_case = map_db_case(res.data[0])
    return compute_case_risks(mapped_case)

@router.get("/summary")
def get_risk_summary():
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').execute()
    cases = [map_db_case(row) for row in res.data]
    
    critical_count = 0
    warning_count = 0
    at_risk_cases = []
    
    for c in cases:
        risks = compute_case_risks(c)
        if risks:
            has_critical = any(r['severity'] == 'critical' for r in risks)
            if has_critical:
                critical_count += 1
            else:
                warning_count += 1
            at_risk_cases.append({
                "caseId": c["id"],
                "title": c["title"],
                "status": c["status"],
                "priority": c["priority"],
                "assignedTo": c["assignedTo"],
                "estimatedValue": c["estimatedValue"],
                "approvedBudget": c["approvedBudget"],
                "risks": risks
            })
            
    healthy_count = len([c for c in cases if c['status'] != 'GRN / Closed']) - len(at_risk_cases)
    
    return {
        "criticalCount": critical_count,
        "warningCount": warning_count,
        "healthyCount": max(0, healthy_count),
        "atRiskCases": at_risk_cases
    }
