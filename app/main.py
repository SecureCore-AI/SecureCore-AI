from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app.routers import auth_router, privileged_router, audit_router
from app.core.scheduler import start_scheduler

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "MVP backend for Privileged Access Misuse & Insider Threat Detection. "
        "Provides RBAC, tamper-evident audit logging, AI-style behavioural "
        "analytics for risk scoring, risk-based access control gating, and a "
        "quantum-proof-crypto-ready vault for sensitive artefacts/credentials."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(privileged_router.router)
app.include_router(audit_router.router)


@app.on_event("startup")
def _on_startup():
    # Kicks off automatic, periodic recalculation of user behavioural baselines
    start_scheduler()


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.APP_NAME}
