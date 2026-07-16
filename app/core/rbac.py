from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import User, RoleName

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Roles that count as "privileged" for PAM purposes
PRIVILEGED_ROLES = {RoleName.ADMIN, RoleName.SUPER_ADMIN}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"User account is locked. Reason: {user.lock_reason or 'No reason specified'}",
        )
    return user


def require_roles(*allowed_roles: RoleName):
    """Dependency factory: restrict an endpoint to specific roles."""
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to access this resource.",
            )
        return current_user
    return dependency


def require_privileged(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in PRIVILEGED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privileged access required.",
        )
    return current_user


def require_risk_below(max_score: int):
    """Risk-based access control: block/step-up if current risk score too high."""
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.current_risk_score >= max_score:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied: current risk score "
                    f"({current_user.current_risk_score}) exceeds allowed threshold "
                    f"({max_score}). Step-up authentication required."
                ),
            )
        return current_user
    return dependency
