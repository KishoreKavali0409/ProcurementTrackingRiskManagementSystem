import requests
from ..db import resend_api_key, resend_from, resend_to

def send_overdue_email(case_id: str, title: str, assignee: str, delay_days: int):
    if not resend_api_key or not resend_to or "placeholder" in resend_api_key or "your_resend" in resend_api_key:
        print("WARNING: Resend is not configured in .env.local. Email notification skipped.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json"
    }
    
    subject = f"⚠️ Overdue Case Alert: {case_id}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e5ee; border-radius: 6px; background-color: #ffffff;">
        <h2 style="color: #ba0517; margin-top: 0; font-size: 20px;">Procurement Alert: Overdue Case Detected</h2>
        <hr style="border: 0; border-top: 1px solid #e0e5ee;" />
        <p style="font-size: 14px; color: #16213a;">
            The following procurement case has exceeded its expected closure timeline:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
            <tr style="background-color: #f8fafc;">
                <td style="padding: 8px; font-weight: bold; width: 120px; border: 1px solid #e0e5ee;">Case ID:</td>
                <td style="padding: 8px; border: 1px solid #e0e5ee; font-family: monospace; font-weight: bold; color: #0070d2;">{case_id}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e0e5ee;">Title:</td>
                <td style="padding: 8px; border: 1px solid #e0e5ee;">{title}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e0e5ee;">Assignee:</td>
                <td style="padding: 8px; border: 1px solid #e0e5ee;">{assignee}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border: 1px solid #e0e5ee;">Delay:</td>
                <td style="padding: 8px; border: 1px solid #e0e5ee; color: #ba0517; font-weight: bold;">{delay_days} days overdue</td>
            </tr>
        </table>
        <p style="font-size: 13px; color: #54698d; line-height: 1.5;">
            Please review the case status, update the expected closure timeline, or take required actions (e.g. following up with bidders or expediting internal approvals).
        </p>
        <hr style="border: 0; border-top: 1px solid #e0e5ee;" />
        <p style="font-size: 11px; color: #9faab7; margin-bottom: 0;">
            This is an automated notification from ProcureTrack Enterprise.
        </p>
    </div>
    """
    
    payload = {
        "from": resend_from,
        "to": [resend_to],
        "subject": subject,
        "html": html_content
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code == 200 or res.status_code == 201:
            print(f"Overdue email alert successfully sent for case {case_id}")
            return True
        else:
            print(f"Failed to send Resend email. Status: {res.status_code}, Response: {res.text}")
            return False
    except Exception as e:
        print(f"Exception sending Resend email: {e}")
        return False
