import json
import requests
from ..db import gemini_api_key

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

def is_key_configured() -> bool:
    return bool(gemini_api_key and "placeholder" not in gemini_api_key.lower())

def generate_gemini_content(prompt: str, json_schema: dict = None) -> str:
    """
    Sends a request to the Gemini API to generate content.
    If json_schema is provided, configures the API to return a structured JSON response.
    """
    if not is_key_configured():
        # Fallback to local mock parsing if API key is not configured
        return generate_mock_fallback(prompt, json_schema)

    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }
    
    if json_schema:
        payload["generationConfig"] = {
            "responseMimeType": "application/json",
            "responseSchema": json_schema
        }
        
    try:
        url = f"{GEMINI_API_URL}?key={gemini_api_key}"
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        res.raise_for_status()
        data = res.json()
        
        # Extract response text
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")
                
        raise ValueError("Invalid response format from Gemini API")
    except Exception as e:
        print(f"Gemini API error: {e}. Falling back to mock generator.")
        return generate_mock_fallback(prompt, json_schema)

def generate_mock_fallback(prompt: str, json_schema: dict = None) -> str:
    """
    Generates realistic mockup data for testing if Gemini is not configured or fails.
    """
    # 1. Email Parser Mock
    if json_schema and "estimatedValue" in json_schema.get("properties", {}):
        # We are parsing an email to extract case info
        mock_data = {
            "title": "Industrial Steel Sheets Procurement",
            "category": "Raw Materials",
            "estimatedValue": 45000.0,
            "approvedBudget": 50000.0,
            "priority": "Medium",
            "department": "Manufacturing",
            "expectedClosure": "2026-08-15"
        }
        
        # Try to customize based on prompt contents if possible
        prompt_lower = prompt.lower()
        if "cement" in prompt_lower or "concrete" in prompt_lower:
            mock_data["title"] = "Bulk Portland Cement Sourcing"
            mock_data["category"] = "Facilities"
            mock_data["estimatedValue"] = 12000.0
            mock_data["approvedBudget"] = 15000.0
        elif "laptop" in prompt_lower or "hardware" in prompt_lower:
            mock_data["title"] = "Developer Laptop Workstations"
            mock_data["category"] = "IT & Software"
            mock_data["estimatedValue"] = 85000.0
            mock_data["approvedBudget"] = 80000.0
            mock_data["priority"] = "High"
            
        return json.dumps(mock_data)

    # 2. Weekly Brief Mock
    if "weekly" in prompt.lower() or "brief" in prompt.lower() or "briefing" in prompt.lower():
        return """# AI Executive Stakeholder Briefing - ProcureTrack

**Date:** July 18, 2026
**Report Type:** Dynamic Procurement AI Synthesis

## 📊 Pipeline Summary
* **Active Procurement Pipeline:** ₹145,000.00 INR (across 4 active cases)
* **Budget Health:** 2 cases are currently exceeding their approved budget boundaries.
* **Timeline Status:** 1 case is marked as **Overdue** (past closure deadline by 1 day).

## ⚠️ High-Risk Cases
### 1. Bulk Portland Cement Sourcing (ID: PC-2025-001)
* **Current Stage:** Technical Evaluation
* **Risk Factors:** Budget Overrun (lowest bid is +15% above target budget)
* **Timeline Alert:** Expected closure was yesterday.
* **Mitigation:** Recommended to trigger a revised round of commercial negotiations immediately.

### 2. Developer Laptop Workstations (ID: PC-2026-002)
* **Current Stage:** Sourcing
* **Risk Factors:** Missing required RFQ documentation.
* **Action Item:** Officer Priya Sharma must upload the finalized RFQ specification.

---
*Report automatically generated using ProcureTrack Enterprise AI Engine.*"""

    # 3. Next Best Actions Mock
    if "next best actions" in prompt.lower() or "next-best-step" in prompt.lower():
        mock_actions = {
            "actions": [
                {
                    "action": "Trigger vendor quote negotiation",
                    "reason": "Current bids exceed estimated value, negotiator role should request revised bids.",
                    "priority": "High"
                },
                {
                    "action": "Complete Technical Evaluation document",
                    "reason": "RFQ phase is closed but the Comparative Analysis document is missing in checklist.",
                    "priority": "Medium"
                },
                {
                    "action": "Schedule timeline review with Kishore Kavali",
                    "reason": "Case has been stuck in current stage for 6 days with no updates.",
                    "priority": "Low"
                }
            ]
        }
        return json.dumps(mock_actions)

    # 4. Risk Analyst Mock
    if "explain the risks" in prompt.lower() or "risk analyst" in prompt.lower() or "risk analysis" in prompt.lower():
        mock_analysis = {
            "summary": "This procurement case faces critical budget escalation risks and potential project timeline delays.",
            "explanations": [
                {
                    "riskType": "Budget Overrun",
                    "severity": "critical",
                    "explanation": "The current lowest bidder quote exceeds the approved budget threshold by 12.5%. This requires immediate escalation to the Procurement Lead."
                },
                {
                    "riskType": "Stale Case",
                    "severity": "warning",
                    "explanation": "No updates have been registered on the timeline for over 7 days. Risk of project delivery bottleneck."
                }
            ],
            "recommendations": [
                "Request revised quotes from suppliers to fit budget constraints.",
                "Assign secondary review tasks to Priya Sharma."
            ]
        }
        return json.dumps(mock_analysis)

    return "AI generation completed successfully."
