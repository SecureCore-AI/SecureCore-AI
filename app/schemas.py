from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models import RoleName, RiskLevel


# ---------- Auth ----------
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleName = RoleName.EMPLOYEE
    department: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: RoleName
    is_privileged: bool
    current_risk_score: int
    current_risk_level: RiskLevel
    is_locked: bool
    lock_reason: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    risk_level: RiskLevel
    step_up_required: bool = False


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------- Audit / Alerts ----------
class AuditLogOut(BaseModel):
    id: str
    user_id: str
    action: str
    resource: Optional[str]
    ip_address: Optional[str]
    success: bool
    risk_score_at_time: int
    timestamp: datetime

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: str
    user_id: str
    rule_triggered: str
    description: str
    risk_score: int
    risk_level: RiskLevel
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ActionRequest(BaseModel):
    """Generic envelope for a privileged action a user wants to perform."""
    action: str
    resource: str
