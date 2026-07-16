from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.rbac import require_roles
from app.core.audit import verify_chain_integrity
from app.models import AuditLog, Alert, RoleName, User
from app.schemas import AuditLogOut, AlertOut, UserOut
from app.detection.bulk_access import get_last_accessor

router = APIRouter(prefix="/audit", tags=["audit-and-alerts"])

OVERSIGHT_ROLES = (RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.AUDITOR)


@router.get("/logs", response_model=list[AuditLogOut])
def list_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(*OVERSIGHT_ROLES)),
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(
    unresolved_only: bool = True,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(*OVERSIGHT_ROLES)),
):
    query = db.query(Alert)
    if unresolved_only:
        query = query.filter(Alert.resolved == False)  # noqa: E712
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"status": "not_found"}
    alert.resolved = True
    db.add(alert)
    db.commit()
    return {"status": "resolved", "alert_id": alert_id}


@router.get("/integrity-check")
def integrity_check(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(RoleName.AUDITOR, RoleName.SUPER_ADMIN)),
):
    """Verifies the hash chain of the audit log to detect any tampering."""
    intact = verify_chain_integrity(db)
    return {"chain_intact": intact}


@router.get("/locked-accounts", response_model=list[UserOut])
def list_locked_accounts(
    db: Session = Depends(get_db),
    _user=Depends(require_roles(RoleName.SUPER_ADMIN, RoleName.AUDITOR)),
):
    return db.query(User).filter(User.is_locked == True).all()


@router.post("/locked-accounts/{user_id}/unlock")
def unlock_account(
    user_id: str,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(RoleName.SUPER_ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_locked = False
    user.lock_reason = None
    db.add(user)
    db.commit()
    return {"status": "unlocked", "user_id": user_id}


@router.get("/last-access/{resource}", response_model=Optional[AuditLogOut])
def get_last_access(
    resource: str,
    db: Session = Depends(get_db),
    _user=Depends(require_roles(*OVERSIGHT_ROLES)),
):
    accessor = get_last_accessor(db, resource)
    if not accessor:
        raise HTTPException(status_code=404, detail="No access logs found for this resource")
    return accessor
