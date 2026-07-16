import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class RoleName(str, enum.Enum):
    EMPLOYEE = "employee"
    CONTRACTOR = "contractor"
    VENDOR = "vendor"
    ADMIN = "admin"                 # standard privileged admin
    SUPER_ADMIN = "super_admin"     # highest tier, most sensitive systems
    AUDITOR = "auditor"             # read-only oversight role


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleName), nullable=False, default=RoleName.EMPLOYEE)
    is_privileged = Column(Boolean, default=False)   # true for admin/super_admin
    is_active = Column(Boolean, default=True)
    department = Column(String, nullable=True)

    # rolling behavioural baseline, updated by the detection engine
    avg_actions_per_hour = Column(Float, default=0.0)
    typical_login_hour_start = Column(Integer, default=8)
    typical_login_hour_end = Column(Integer, default=18)
    last_known_ip = Column(String, nullable=True)

    current_risk_score = Column(Integer, default=0)
    current_risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW)
    is_locked = Column(Boolean, default=False)
    lock_reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="user")
    alerts = relationship("Alert", back_populates="user")


class PrivilegedResource(Base):
    """Represents a critical administrative system/asset under PAM control."""
    __tablename__ = "privileged_resources"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False)          # e.g. "Core-Banking-DB-Prod"
    sensitivity = Column(Enum(RiskLevel), default=RiskLevel.HIGH)
    required_role = Column(Enum(RoleName), default=RoleName.ADMIN)
    requires_step_up_auth = Column(Boolean, default=True)


class AuditLog(Base):
    """Immutable, append-only log of every privileged/administrative action."""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)          # e.g. "LOGIN", "READ_RECORD", "GRANT_ROLE"
    resource = Column(String, nullable=True)          # resource name/id touched
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    success = Column(Boolean, default=True)
    risk_score_at_time = Column(Integer, default=0)
    metadata_json = Column(Text, nullable=True)        # extra context, JSON-encoded string
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # integrity: hash chain so log tampering is detectable (see app/core/audit_integrity.py)
    prev_hash = Column(String, nullable=True)
    entry_hash = Column(String, nullable=False)

    user = relationship("User", back_populates="audit_logs")


class Alert(Base):
    """Insider-threat / misuse alert raised by the behavioural detection engine."""
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    rule_triggered = Column(String, nullable=False)     # e.g. "OFF_HOURS_PRIVILEGED_ACCESS"
    description = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="alerts")
