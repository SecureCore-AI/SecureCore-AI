from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.rbac import require_privileged, require_risk_below
from app.core.audit import write_audit_log
from app.detection.behavior_analytics import evaluate_action, apply_detection_result
from app.config import settings
from app.models import User
from app.schemas import ActionRequest, UserOut
from app.detection.kill_chain import check_kill_chain
from app.detection.bulk_access import check_bulk_access, apply_bulk_access_response

router = APIRouter(prefix="/privileged", tags=["privileged-access"])


@router.post("/action")
def perform_privileged_action(
    payload: ActionRequest,
    request: Request,
    db: Session = Depends(get_db),
    # RBAC gate: must hold a privileged role
    current_user: User = Depends(require_privileged),
    # Risk-based access control gate: current risk must be below the
    # "high" threshold, otherwise the request is blocked pending step-up auth
    _risk_gate: User = Depends(require_risk_below(settings.RISK_HIGH_THRESHOLD)),
):
    """
    Example endpoint representing "any privileged action against a critical
    administrative system". Every call here is:
      1. Gated by RBAC (must be admin/super_admin)
      2. Gated by real-time risk score (blocked if too risky -> step-up auth)
      3. Scored by the behavioural detection engine
      4. Written to the tamper-evident audit log
    """
    client_ip = request.client.host if request.client else "unknown"

    result = evaluate_action(db, current_user, action=payload.action, resource=payload.resource)
    apply_detection_result(db, current_user, result)

    audit_entry = write_audit_log(
        db,
        user_id=current_user.id,
        action=payload.action,
        resource=payload.resource,
        ip_address=client_ip,
        success=True,
        risk_score_at_time=result.risk_score,
        metadata={"triggered_rules": result.triggered_rules, "explanation": result.explanation},
    )

    # Bulk Access Check
    bulk_triggered = check_bulk_access(db, current_user)
    apply_bulk_access_response(db, current_user, bulk_triggered, client_ip)
    if bulk_triggered:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="User account locked due to bulk access threshold breach.",
        )

    # Kill-Chain Check
    kc_triggered, pattern_name = check_kill_chain(db, current_user)
    if kc_triggered:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"User account locked due to kill-chain detection: {pattern_name}",
        )

    return {
        "status": "action_recorded",
        "audit_log_id": audit_entry.id,
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "triggered_rules": result.triggered_rules,
    }


@router.get("/me", response_model=UserOut)
def my_privileged_profile(current_user: User = Depends(require_privileged)):
    return current_user
