from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import User, AuditLog, Alert, RiskLevel

def check_bulk_access(db: Session, user: User) -> bool:
    window_start = datetime.utcnow() - timedelta(minutes=settings.BULK_ACCESS_WINDOW_MINUTES)
    count = (
        db.query(func.count(AuditLog.resource.distinct()))
        .filter(
            AuditLog.user_id == user.id,
            AuditLog.timestamp >= window_start,
            AuditLog.resource != None,
            AuditLog.resource != ""
        )
        .scalar()
    )
    return count > settings.BULK_ACCESS_MAX_RESOURCES

def apply_bulk_access_response(db: Session, user: User, result: bool, ip_address: str) -> None:
    if not result:
        return
        
    user.is_locked = True
    user.lock_reason = "Bulk access threshold breach detected."
    db.add(user)
    
    alert = Alert(
        user_id=user.id,
        rule_triggered="BULK_ACCESS_BREACH",
        description=f"User accessed more than {settings.BULK_ACCESS_MAX_RESOURCES} distinct resources within {settings.BULK_ACCESS_WINDOW_MINUTES} minutes.",
        risk_score=100,
        risk_level=RiskLevel.CRITICAL,
    )
    db.add(alert)
    db.commit()
    
    # Retrieve all distinct resources accessed during the window
    window_start = datetime.utcnow() - timedelta(minutes=settings.BULK_ACCESS_WINDOW_MINUTES)
    resources = (
        db.query(AuditLog.resource)
        .filter(
            AuditLog.user_id == user.id,
            AuditLog.timestamp >= window_start,
            AuditLog.resource != None,
            AuditLog.resource != ""
        )
        .distinct()
        .all()
    )
    resources_list = [r[0] for r in resources if r[0]]
    
    from app.core.notifications import notify_critical_incident
    notify_critical_incident(
        incident_type="BULK_ACCESS_BREACH",
        user_id=user.id,
        username=user.username,
        description=alert.description,
        resources_touched=resources_list,
        ip_address=ip_address
    )

def get_last_accessor(db: Session, resource: str) -> Optional[AuditLog]:
    return (
        db.query(AuditLog)
        .filter(AuditLog.resource == resource)
        .order_by(AuditLog.timestamp.desc())
        .first()
    )
