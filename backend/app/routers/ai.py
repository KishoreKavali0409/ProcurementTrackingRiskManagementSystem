from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
import json
from ..db import supabase
from ..services.ai_service import generate_gemini_content, is_key_configured
from ..services.risk_engine import compute_case_risks
from .cases import map_db_case

router = APIRouter(prefix="/ai", tags=["ai"])

# 1. Email Parser Schemas & Endpoint
EMAIL_PARSER_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "title": {"type": "STRING", "description": "Short, clear title for the procurement request"},
        "category": {"type": "STRING", "description": "Procurement category (e.g. Raw Materials, IT & Software, Professional Services, Facilities, Logistics)"},
        "estimatedValue": {"type": "NUMBER", "description": "Estimated value of procurement in INR"},
        "approvedBudget": {"type": "NUMBER", "description": "Approved budget limit in INR"},
        "priority": {"type": "STRING", "description": "Priority tier: Low, Medium, High, or Critical"},
        "department": {"type": "STRING", "description": "Department name (e.g. Engineering, Manufacturing, IT, HR, Legal)"},
        "expectedClosure": {"type": "STRING", "description": "Expected closure deadline date (YYYY-MM-DD)"}
    },
    "required": ["title", "category", "estimatedValue", "approvedBudget", "priority", "department"]
}

class EmailPayload(CamelModel if 'CamelModel' in globals() else object):
    emailText: str

# Handle dynamic schemas Pydantic helper
from pydantic import BaseModel
class EmailParseRequest(BaseModel):
    emailText: str

@router.post("/parse-email")
def parse_email_endpoint(payload: EmailParseRequest):
    prompt = f"""
    You are an expert procurement analyst. Parse the following email text and extract structured case metadata.
    Ensure values like category match one of the standard categories (Raw Materials, IT & Software, Professional Services, Facilities, Logistics).
    Ensure currency conversion is handled if values are in other currencies (convert to INR, e.g. 1 USD = 83 INR, 1 EUR = 90 INR).
    
    Email Content:
    \"\"\"
    {payload.emailText}
    \"\"\"
    """
    
    res_str = generate_gemini_content(prompt, EMAIL_PARSER_SCHEMA)
    try:
        return json.loads(res_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse structured JSON from AI: {e}")


# 2. Risk Analyst Schema & Endpoint
RISK_ANALYST_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "summary": {"type": "STRING", "description": "High-level risk summary briefing"},
        "explanations": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "riskType": {"type": "STRING", "description": "Type of risk (e.g. Overdue, Budget Overrun, Stale Case)"},
                    "severity": {"type": "STRING", "description": "Severity: warning or critical"},
                    "explanation": {"type": "STRING", "description": "Detailed explanation of why this risk is flagged and its business impact"}
                },
                "required": ["riskType", "severity", "explanation"]
            }
        },
        "recommendations": {
            "type": "ARRAY",
            "items": {"type": "STRING", "description": "Immediate mitigation action checklist items"}
        }
    },
    "required": ["summary", "explanations", "recommendations"]
}

@router.post("/analyze-risk/{case_id}")
def analyze_case_risk(case_id: str):
    # Fetch case details
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').eq('id', case_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Case not found")
        
    mapped_case = map_db_case(res.data[0])
    # Compute active rule-based risks
    calculated_risks = compute_case_risks(mapped_case)
    
    # Fetch any quotes submitted to evaluate bid pricing
    quotes_res = supabase.table('quotations').select('*').eq('case_id', case_id).execute()
    quotes = quotes_res.data or []
    
    prompt = f"""
    You are an AI Risk Auditor for an enterprise procurement team.
    Provide a detailed risk analysis for the following case details, active rule-based alerts, and vendor quotations.
    Explain the business impact of these risks and suggest specific mitigations.
    
    Case Details:
    - ID: {mapped_case['id']}
    - Title: {mapped_case['title']}
    - Status: {mapped_case['status']}
    - Priority: {mapped_case['priority']}
    - Estimated Value: {mapped_case['estimatedValue']} INR
    - Approved Budget: {mapped_case['approvedBudget']} INR
    - Expected Closure: {mapped_case['expectedClosure']}
    
    Active Alerts Flagged:
    {json.dumps(calculated_risks)}
    
    Submitted Bids:
    {json.dumps(quotes)}
    """
    
    res_str = generate_gemini_content(prompt, RISK_ANALYST_SCHEMA)
    try:
        return json.loads(res_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate risk explanation: {e}")


# 3. Next Best Actions Schema & Endpoint
NEXT_ACTIONS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "actions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "action": {"type": "STRING", "description": "Highly actionable task name"},
                    "reason": {"type": "STRING", "description": "Detailed reasoning behind this recommendation"},
                    "priority": {"type": "STRING", "description": "Task priority: High, Medium, or Low"}
                },
                "required": ["action", "reason", "priority"]
            }
        }
    },
    "required": ["actions"]
}

@router.post("/next-actions/{case_id}")
def get_case_next_actions(case_id: str):
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').eq('id', case_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Case not found")
        
    mapped_case = map_db_case(res.data[0])
    calculated_risks = compute_case_risks(mapped_case)
    
    prompt = f"""
    You are an executive procurement coach. Provide the 3 "Next Best Actions" (tasks) that should be completed for this case to resolve current delays, verify documents, or negotiate pricing.
    
    Case: {mapped_case['title']} (ID: {mapped_case['id']})
    Current Stage: {mapped_case['status']}
    Assigned To: {mapped_case['assignedTo']}
    Active Alerts: {json.dumps(calculated_risks)}
    Document Checklist: {json.dumps(mapped_case['documents'])}
    """
    
    res_str = generate_gemini_content(prompt, NEXT_ACTIONS_SCHEMA)
    try:
        return json.loads(res_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile next best actions: {e}")


# 4. Weekly Stakeholder Briefing Endpoint
@router.post("/weekly-brief")
def get_weekly_briefing():
    # Fetch all cases and compute overall stats
    res = supabase.table('cases').select('*, case_updates(*), document_checklist(*)').execute()
    cases = [map_db_case(row) for row in res.data]
    
    overdue_count = 0
    overrun_count = 0
    critical_cases = []
    
    for c in cases:
        risks = compute_case_risks(c)
        if risks:
            has_overdue = any(r['type'] == 'Overdue' for r in risks)
            has_overrun = any('Overrun' in r['type'] for r in risks)
            if has_overdue: overdue_count += 1
            if has_overrun: overrun_count += 1
            if c['priority'] == 'Critical' or has_overdue or has_overrun:
                critical_cases.append({
                    "id": c["id"],
                    "title": c["title"],
                    "status": c["status"],
                    "priority": c["priority"],
                    "risks": [r["msg"] for r in risks]
                })
                
    prompt = f"""
    You are a Director of Procurement. Generate a formal, professional weekly stakeholder executive briefing (markdown format).
    Synthesize the following statistics and high-risk alerts. Use standard corporate headers and formatting.
    
    System Statistics:
    - Total Active Cases: {len(cases)}
    - Overdue Cases: {overdue_count}
    - Cases Exceeding Budget: {overrun_count}
    
    Cases Flagged for Escalation:
    {json.dumps(critical_cases)}
    """
    
    # This endpoint returns plain markdown text, so we do not pass a JSON schema config
    markdown_brief = generate_gemini_content(prompt)
    return {"brief": markdown_brief, "configured": is_key_configured()}
