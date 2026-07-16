import json
import smtplib
import urllib.request
from email.mime.text import MIMEText
from typing import List, Optional

from app.config import settings

def notify_law_enforcement_stub(
    incident_type: str,
    user_id: str,
    username: str,
    description: str,
    resources_touched: List[str],
    ip_address: str
) -> None:
    """
    Stub function for law-enforcement escalation.
    
    CRITICAL NOTE: Real-world law-enforcement escalation cannot and should not be 
    fully automated without a specific legal agreement, API gateway, or direct compliance
    team review. Automated/direct reporting to authorities is outside the scope of a 
    generic threat detection backend and represents a high-risk human/compliance decision.
    
    Currently, this function only logs the intent to escalate.
    """
    print(
        f"[escalation] [STUB] Law Enforcement Notification required for Critical Incident!\n"
        f"  Incident: {incident_type}\n"
        f"  User: {username} ({user_id})\n"
        f"  Details: {description}\n"
    )

def notify_critical_incident(
    incident_type: str,
    user_id: str,
    username: str,
    description: str,
    resources_touched: List[str],
    ip_address: str
) -> None:
    # 1. Always log the incident to console/stdout
    subject = f"CRITICAL INCIDENT ALERT: {incident_type}"
    body = (
        f"Critical security incident detected!\n\n"
        f"Incident Type: {incident_type}\n"
        f"User ID: {user_id}\n"
        f"Username: {username}\n"
        f"Description: {description}\n"
        f"Resources Touched: {', '.join(resources_touched)}\n"
        f"IP Address: {ip_address}\n"
    )
    print(f"\n==================================================")
    print(subject)
    print(f"--------------------------------------------------")
    print(body)
    print(f"==================================================\n")
    
    # 2. SMTP Notifications
    if settings.SMTP_HOST:
        # Check bank owner email
        if settings.NOTIFY_BANK_OWNER_EMAIL:
            _send_email_smtp(settings.NOTIFY_BANK_OWNER_EMAIL, subject, body)
        
        # Check security team email
        if settings.NOTIFY_SECURITY_TEAM_EMAIL:
            _send_email_smtp(settings.NOTIFY_SECURITY_TEAM_EMAIL, subject, body)
            
    # 3. Webhook Notification
    if settings.NOTIFY_WEBHOOK_URL:
        payload = {
            "incident_type": incident_type,
            "user_id": user_id,
            "username": username,
            "description": description,
            "resources_touched": resources_touched,
            "ip_address": ip_address
        }
        _send_webhook_post(settings.NOTIFY_WEBHOOK_URL, payload)
        
    # 4. Call law enforcement stub
    notify_law_enforcement_stub(
        incident_type, user_id, username, description, resources_touched, ip_address
    )

def _send_email_smtp(recipient: str, subject: str, body: str) -> None:
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_ADDRESS or "no-reply@insiderthreat.local"
    msg["To"] = recipient
    
    try:
        port = settings.SMTP_PORT or 587
        with smtplib.SMTP(settings.SMTP_HOST, port) as server:
            server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[notifications] Email sent to {recipient}")
    except Exception as e:
        print(f"[notifications] Failed to send email to {recipient}: {e}")

def _send_webhook_post(url: str, payload: dict) -> None:
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            pass
        print(f"[notifications] Webhook successfully POSTed to {url}")
    except Exception as e:
        print(f"[notifications] Failed to send webhook POST to {url}: {e}")
