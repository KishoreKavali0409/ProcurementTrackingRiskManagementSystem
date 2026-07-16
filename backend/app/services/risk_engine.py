from datetime import datetime, date

STAGE_REQUIRED_DOCS = {
    'RFQ Draft': ['RFQ'],
    'Bidders Defined': ['RFQ'],
    'RFQ Shared': ['RFQ'],
    'Offers Received': ['RFQ', 'Vendor Quotes'],
    'Technical Evaluation': ['RFQ', 'Vendor Quotes', 'Comparative Analysis'],
    'Commercial Negotiation': ['RFQ', 'Vendor Quotes', 'Comparative Analysis'],
    'Approval Pending': ['RFQ', 'Vendor Quotes', 'Comparative Analysis', 'Approval Form'],
    'PO Released': ['RFQ', 'Vendor Quotes', 'Comparative Analysis', 'Approval Form', 'PO Copy'],
    'Legal / NDA': ['RFQ', 'Vendor Quotes', 'Comparative Analysis', 'Approval Form', 'PO Copy', 'Contract Draft'],
    'GRN / Closed': ['RFQ', 'Vendor Quotes', 'Comparative Analysis', 'Approval Form', 'PO Copy', 'Contract Draft', 'Final Contract']
}

def parse_date(date_str) -> date:
    if not date_str:
        return None
    if isinstance(date_str, date):
        return date_str
    try:
        return datetime.strptime(date_str.split('T')[0], '%Y-%m-%d').date()
    except (ValueError, AttributeError):
        return None

def compute_case_risks(case: dict) -> list:
    risks = []
    
    status = case.get('status')
    if status == 'GRN / Closed':
        return risks
        
    today = datetime.now().date()
    opened_date = parse_date(case.get('openedDate'))
    expected_closure = parse_date(case.get('expectedClosure'))
    last_updated = parse_date(case.get('lastUpdated'))
    
    estimated_value = float(case.get('estimatedValue') or 0.0)
    approved_budget = float(case.get('approvedBudget') or 0.0)
    
    # 1. Overdue Check
    if expected_closure:
        days_to_close = (expected_closure - today).days
        if days_to_close < 0:
            risks.append({
                "type": "Overdue",
                "severity": "critical",
                "msg": f"Past expected closure date by {abs(days_to_close)} days",
                "icon": "●"
            })
        elif days_to_close <= 3:
            risks.append({
                "type": "Due Soon",
                "severity": "warning",
                "msg": f"Closes in {days_to_close} days",
                "icon": "●"
            })
            
    # 2. Stale Check (no updates in >= 7 days)
    if last_updated:
        days_since_update = (today - last_updated).days
        if days_since_update >= 10:
            risks.append({
                "type": "Stale",
                "severity": "critical",
                "msg": f"No status updates in {days_since_update} days",
                "icon": "●"
            })
        elif days_since_update >= 7:
            risks.append({
                "type": "Stale",
                "severity": "warning",
                "msg": f"No status updates in {days_since_update} days",
                "icon": "●"
            })
            
    # 3. Stuck in Stage Check (same status for > 5 days)
    if last_updated:
        days_in_stage = (today - last_updated).days
        if days_in_stage > 5 and status not in ['RFQ Draft', 'GRN / Closed']:
            risks.append({
                "type": "Stuck in Stage",
                "severity": "warning",
                "msg": f"Stuck in '{status}' stage for {days_in_stage} days",
                "icon": "●"
            })

    # 4. Budget Overrun Check
    if approved_budget > 0:
        overrun_percent = ((estimated_value - approved_budget) / approved_budget) * 100
        if overrun_percent > 10:
            risks.append({
                "type": "Budget Overrun",
                "severity": "critical",
                "msg": f"+{overrun_percent:.1f}% over approved budget",
                "icon": "●"
            })
        elif overrun_percent > 0:
            risks.append({
                "type": "Budget Escalation",
                "severity": "warning",
                "msg": f"+{overrun_percent:.1f}% over approved budget",
                "icon": "●"
            })
            
    # 5. Missing Documents for current stage
    required_docs = STAGE_REQUIRED_DOCS.get(status, [])
    documents = case.get('documents', {})
    missing_docs = [doc for doc in required_docs if not documents.get(doc, False)]
    if missing_docs:
        age_days = (today - opened_date).days if opened_date else 0
        if age_days > 7:
            risks.append({
                "type": "Missing Docs",
                "severity": "warning",
                "msg": f"Missing: {', '.join(missing_docs)} required for '{status}'",
                "icon": "●"
            })
            
    # 6. Long running Critical case
    if opened_date:
        age_days = (today - opened_date).days
        if age_days > 30 and case.get('priority') == 'Critical':
            risks.append({
                "type": "Long-Running Critical",
                "severity": "critical",
                "msg": f"Critical priority case open for {age_days} days",
                "icon": "●"
            })
            
    return risks
