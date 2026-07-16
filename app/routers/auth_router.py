from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.audit import write_audit_log
from app.detection.behavior_analytics import evaluate_login, apply_detection_result
from app.detection.kill_chain import check_kill_chain
from app.models import User, RoleName
from app.schemas import UserCreate, UserOut, LoginRequest, Token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_privileged=payload.role in (RoleName.ADMIN, RoleName.SUPER_ADMIN),
        department=payload.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    client_ip = request.client.host if request.client else "unknown"

    if not user or not verify_password(payload.password, user.hashed_password):
        if user:
            write_audit_log(
                db, user_id=user.id, action="LOGIN", ip_address=client_ip,
                success=False, risk_score_at_time=user.current_risk_score,
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # --- AI-driven behavioural scoring happens on every privileged login ---
    result = evaluate_login(db, user, ip_address=client_ip)
    apply_detection_result(db, user, result)

    write_audit_log(
        db, user_id=user.id, action="LOGIN", ip_address=client_ip, success=True,
        risk_score_at_time=result.risk_score,
        metadata={"triggered_rules": result.triggered_rules},
    )

    user.last_known_ip = client_ip
    db.add(user)
    db.commit()

    triggered, pattern_name = check_kill_chain(db, user)
    if triggered:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"User account locked due to kill-chain detection: {pattern_name}",
        )

    step_up_required = result.risk_score >= settings.RISK_HIGH_THRESHOLD
    token_minutes = (
        settings.STEP_UP_TOKEN_EXPIRE_MINUTES if step_up_required
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    token = create_access_token(
        subject=user.id,
        extra_claims={"role": user.role.value, "risk_level": result.risk_level.value},
        expires_minutes=token_minutes,
    )

    return Token(
        access_token=token,
        risk_level=result.risk_level,
        step_up_required=step_up_required,
    )
