"""
Behavioural Analytics / Insider Threat Detection engine.

This is a rule-weighted statistical scoring engine -- a solid, explainable
baseline for an MVP. Each signal below is intentionally simple so it's easy
to reason about, test, and demo. In a fuller build you'd extend `score_event`
to also call out to a trained ML model (e.g. isolation forest / autoencoder
over the same feature set) and blend its anomaly score in; the interface
(`DetectionResult`) is designed so that swap is additive, not a rewrite.

Signals implemented:
  1. Off-hours privileged access
  2. Anomalous / new source IP for a privileged user
  3. Access volume spike vs the user's rolling baseline
  4. Rapid repeated failed logins (credential-stuffing / brute force signal)
  5. Access to a resource above the user's normal sensitivity tier
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models import User, AuditLog, Alert, RiskLevel
from app.core.audit import write_audit_log


@dataclass
class DetectionResult:
    risk_score: int
    risk_level: RiskLevel
    triggered_rules: list[str] = field(default_factory=list)
    explanation: list[str] = field(default_factory=list)


def _risk_level_for_score(score: int) -> RiskLevel:
    if score >= settings.RISK_HIGH_THRESHOLD:
        return RiskLevel.CRITICAL
    if score >= settings.RISK_MEDIUM_THRESHOLD:
        return RiskLevel.HIGH
    if score >= settings.RISK_LOW_THRESHOLD:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def evaluate_login(
    db: Session, user: User, *, ip_address: str, timestamp: Optional[datetime] = None
) -> DetectionResult:
    """Scores a login event for a privileged (or any) user."""
    timestamp = timestamp or datetime.utcnow()
    score = 0
    rules: list[str] = []
    explanation: list[str] = []

    # --- Signal 1: off-hours access ---
    hour = timestamp.hour
    outside_typical_window = not (user.typical_login_hour_start <= hour < user.typical_login_hour_end)
    is_global_off_hours = hour >= settings.OFF_HOURS_START or hour < settings.OFF_HOURS_END
    if user.is_privileged and (outside_typical_window and is_global_off_hours):
        score += 25
        rules.append("OFF_HOURS_PRIVILEGED_LOGIN")
        explanation.append(
            f"Privileged login at {hour}:00 UTC, outside typical window "
            f"({user.typical_login_hour_start}:00-{user.typical_login_hour_end}:00)."
        )

    # --- Signal 2: new / unusual source IP ---
    if user.last_known_ip and ip_address != user.last_known_ip:
        score += 20
        rules.append("NEW_SOURCE_IP")
        explanation.append(f"Login from unfamiliar IP {ip_address} (last known: {user.last_known_ip}).")

    # --- Signal 3: rapid repeated failed logins (velocity) ---
    window_start = timestamp - timedelta(minutes=settings.MAX_FAILED_LOGINS_WINDOW_MIN)
    recent_failures = (
        db.query(AuditLog)
        .filter(
            AuditLog.user_id == user.id,
            AuditLog.action == "LOGIN",
            AuditLog.success == False,  # noqa: E712
            AuditLog.timestamp >= window_start,
        )
        .count()
    )
    if recent_failures >= settings.MAX_FAILED_LOGINS_THRESHOLD:
        score += 35
        rules.append("FAILED_LOGIN_VELOCITY")
        explanation.append(
            f"{recent_failures} failed logins in the last "
            f"{settings.MAX_FAILED_LOGINS_WINDOW_MIN} minutes (possible credential attack)."
        )

    level = _risk_level_for_score(score)
    return DetectionResult(risk_score=min(score, 100), risk_level=level,
                            triggered_rules=rules, explanation=explanation)


def evaluate_action(
    db: Session, user: User, *, action: str, resource: str, timestamp: Optional[datetime] = None
) -> DetectionResult:
    """Scores a privileged action (e.g. reading a sensitive record, granting a role)."""
    timestamp = timestamp or datetime.utcnow()
    score = 0
    rules: list[str] = []
    explanation: list[str] = []

    # --- Signal 4: access volume spike vs rolling baseline ---
    one_hour_ago = timestamp - timedelta(hours=1)
    actions_last_hour = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user.id, AuditLog.timestamp >= one_hour_ago)
        .count()
    )
    baseline = max(user.avg_actions_per_hour, 1.0)
    if actions_last_hour > baseline * settings.ACCESS_VOLUME_BASELINE_MULTIPLIER:
        score += 30
        rules.append("ACCESS_VOLUME_SPIKE")
        explanation.append(
            f"{actions_last_hour} actions in the last hour vs baseline of {baseline:.1f}/hr "
            f"({settings.ACCESS_VOLUME_BASELINE_MULTIPLIER}x threshold exceeded)."
        )

    # --- Signal 5: sensitive-action keywords (bulk export, mass grant, deletion) ---
    high_risk_actions = {"EXPORT_DATA", "GRANT_ROLE", "DELETE_RECORD", "DISABLE_LOGGING", "MODIFY_PERMISSIONS"}
    if action.upper() in high_risk_actions:
        score += 20
        rules.append("SENSITIVE_ACTION_TYPE")
        explanation.append(f"Action '{action}' is classified as high-sensitivity.")

    level = _risk_level_for_score(score)
    return DetectionResult(risk_score=min(score, 100), risk_level=level,
                            triggered_rules=rules, explanation=explanation)


def apply_detection_result(db: Session, user: User, result: DetectionResult) -> None:
    """Updates the user's live risk score and raises an Alert if warranted."""
    user.current_risk_score = result.risk_score
    user.current_risk_level = result.risk_level
    db.add(user)
    db.commit()

    if result.triggered_rules and result.risk_score >= settings.RISK_LOW_THRESHOLD:
        alert = Alert(
            user_id=user.id,
            rule_triggered=",".join(result.triggered_rules),
            description=" | ".join(result.explanation),
            risk_score=result.risk_score,
            risk_level=result.risk_level,
        )
        db.add(alert)
        db.commit()


def update_baseline(db: Session, user: User) -> None:
    """Recomputes the user's rolling actions/hour baseline from the last 7 days.
    Call this periodically (e.g. nightly job / scheduler) to keep baselines fresh."""
    week_ago = datetime.utcnow() - timedelta(days=7)
    total_actions = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user.id, AuditLog.timestamp >= week_ago)
        .count()
    )
    hours_elapsed = 24 * 7
    user.avg_actions_per_hour = total_actions / hours_elapsed
    db.add(user)
    db.commit()
