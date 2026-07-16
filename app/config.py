"""
Central configuration for the Insider Threat / Privileged Access Misuse backend.

All secrets below are read from environment variables in real deployments.
Defaults are provided ONLY for local development.
"""
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Privileged Access Misuse & Insider Threat Detection API"

    # --- Database ---
    DATABASE_URL: str = "sqlite:///./insider_threat.db"

    # --- JWT / Session auth ---
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PROD"          # set via env var in real deploy
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15               # short-lived, privileged sessions
    STEP_UP_TOKEN_EXPIRE_MINUTES: int = 5                # for high-risk re-auth

    # --- Risk engine thresholds (0-100 risk score) ---
    RISK_LOW_THRESHOLD: int = 30
    RISK_MEDIUM_THRESHOLD: int = 60
    RISK_HIGH_THRESHOLD: int = 80   # >= this => auto step-up auth / block

    # --- Behavioural analytics ---
    OFF_HOURS_START: int = 21   # 24h clock, local admin baseline
    OFF_HOURS_END: int = 6
    MAX_FAILED_LOGINS_WINDOW_MIN: int = 15
    MAX_FAILED_LOGINS_THRESHOLD: int = 5
    ACCESS_VOLUME_BASELINE_MULTIPLIER: float = 3.0  # flag if actions/hr > 3x user baseline

    # --- Quantum-Proof Cryptography ---
    # Classical layer used today; ML-KEM (Kyber) hook documented in app/crypto/pqc.py
    PQC_HYBRID_MODE: bool = True
    AUDIT_CHAIN_KEY: str = "dev-only-chain-key-change-me"

    # --- Bulk Access ---
    BULK_ACCESS_MAX_RESOURCES: int = 5
    BULK_ACCESS_WINDOW_MINUTES: int = 30

    # --- Incident Notification Service ---
    NOTIFY_BANK_OWNER_EMAIL: Optional[str] = None
    NOTIFY_SECURITY_TEAM_EMAIL: Optional[str] = None
    NOTIFY_WEBHOOK_URL: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_ADDRESS: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
