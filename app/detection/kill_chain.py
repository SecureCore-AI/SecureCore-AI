from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User, Alert, RiskLevel

ATTACK_PATTERNS = {
    "EXFILTRATION_CHAIN": [
        "NEW_SOURCE_IP",
        "OFF_HOURS_PRIVILEGED_LOGIN",
        "ACCESS_VOLUME_SPIKE",
        "SENSITIVE_ACTION_TYPE"
    ],
    "ACCOUNT_TAKEOVER_CHAIN": [
        "FAILED_LOGIN_VELOCITY",
        "NEW_SOURCE_IP",
        "SENSITIVE_ACTION_TYPE"
    ]
}

def get_lcs_length(list1: list[str], list2: list[str]) -> int:
    n = len(list1)
    m = len(list2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if list1[i-1] == list2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[n][m]

def check_kill_chain(db: Session, user: User) -> tuple[bool, str | None]:
    cutoff = datetime.utcnow() - timedelta(minutes=60)
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == user.id, Alert.created_at >= cutoff)
        .order_by(Alert.created_at.asc())
        .all()
    )
    
    # Flatten rule_triggered (comma-separated) into an ordered list
    triggered_sequence = []
    for alert in alerts:
        parts = [p.strip() for p in alert.rule_triggered.split(",") if p.strip()]
        triggered_sequence.extend(parts)
        
    for pattern_name, pattern_steps in ATTACK_PATTERNS.items():
        matched_len = get_lcs_length(pattern_steps, triggered_sequence)
        if matched_len >= 3:
            # Trigger kill chain
            user.is_locked = True
            user.lock_reason = f"Kill-chain pattern {pattern_name} detected."
            db.add(user)
            
            new_alert = Alert(
                user_id=user.id,
                rule_triggered=f"KILL_CHAIN::{pattern_name}",
                description=f"Kill-chain correlation engine triggered pattern '{pattern_name}' (matched {matched_len} steps).",
                risk_score=100,
                risk_level=RiskLevel.CRITICAL,
            )
            db.add(new_alert)
            db.commit()
            return True, pattern_name
            
    return False, None
