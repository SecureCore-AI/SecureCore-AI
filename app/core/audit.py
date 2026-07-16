import json
from typing import Optional

from sqlalchemy.orm import Session

from app.crypto.pqc import chain_hash
from app.models import AuditLog
from app.config import settings

# In production, load this from a secrets manager / HSM, not an env default.
_CHAIN_KEY = settings.AUDIT_CHAIN_KEY.encode()


def _get_last_hash(db: Session) -> Optional[str]:
    last = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    return last.entry_hash if last else None


def write_audit_log(
    db: Session,
    *,
    user_id: str,
    action: str,
    resource: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    success: bool = True,
    risk_score_at_time: int = 0,
    metadata: Optional[dict] = None,
) -> AuditLog:
    prev_hash = _get_last_hash(db)
    payload = json.dumps({
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "ip_address": ip_address,
        "success": success,
        "risk_score_at_time": risk_score_at_time,
        "metadata": metadata or {},
    }, sort_keys=True)

    entry_hash = chain_hash(prev_hash, payload, _CHAIN_KEY)

    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        risk_score_at_time=risk_score_at_time,
        metadata_json=json.dumps(metadata or {}),
        prev_hash=prev_hash,
        entry_hash=entry_hash,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_chain_integrity(db: Session) -> bool:
    """Walks the entire audit log and re-derives each hash to detect tampering."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.asc()).all()
    prev_hash = None
    for log in logs:
        payload = json.dumps({
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "ip_address": log.ip_address,
            "success": log.success,
            "risk_score_at_time": log.risk_score_at_time,
            "metadata": json.loads(log.metadata_json or "{}"),
        }, sort_keys=True)
        expected = chain_hash(prev_hash, payload, _CHAIN_KEY)
        if expected != log.entry_hash:
            return False
        prev_hash = log.entry_hash
    return True
