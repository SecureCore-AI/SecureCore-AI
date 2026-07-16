# Privileged Access Misuse & Insider Threat Detection — Backend MVP

FastAPI backend implementing the core of the problem statement:

| Requirement | Where it lives |
|---|---|
| Detects misuse of privileged accounts | `app/detection/behavior_analytics.py` + `/privileged/action` |
| Insider threat detection (real time) | scoring runs synchronously on every login and privileged action |
| AI-driven behavioural analysis | rule-weighted anomaly scoring engine (swap-in point for an ML model documented in the module docstring) |
| Risk-based access control | `app/core/rbac.py::require_risk_below` gate on privileged endpoints |
| Protects critical administrative systems | `PrivilegedResource` model + RBAC + risk gating on `/privileged/*` |
| Quantum-Proof Cryptography (QPC) | `app/crypto/pqc.py` — hybrid KEM + AES-256-GCM vault, with a documented one-file swap to a real PQC library (liboqs / ML-KEM) |

## Quick start

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Suggested demo flow

1. `POST /auth/register` — create an admin user (`role: "admin"`).
2. `POST /auth/login` — log in. Response includes `risk_level` and
   `step_up_required`. Try logging in at an unusual hour or from a
   different simulated IP (send a different `X-Forwarded-For` / test
   client) to see the risk score climb.
3. `POST /privileged/action` (with the bearer token) — perform an action
   like `{"action": "EXPORT_DATA", "resource": "core-banking-db"}`. This is
   scored, gated by risk level, and written to the tamper-evident audit log.
4. `GET /audit/alerts` (as `admin`/`super_admin`/`auditor`) — see any
   insider-threat alerts raised.
5. `GET /audit/integrity-check` (as `auditor`/`super_admin`) — verifies the
   hash chain over the entire audit log to prove it hasn't been tampered with.

## What's intentionally scoped out of this MVP (next steps)

- **Real PQC primitives**: `app/crypto/pqc.py` ships a classical X25519 KEM
  behind a `KEMProvider` interface. Install `liboqs-python` and implement
  `KEMProvider` against ML-KEM/Kyber to go fully post-quantum without
  touching any calling code.
- **ML-based anomaly detection**: today's engine is explainable rule-weighted
  scoring. `DetectionResult` is structured so you can blend in an isolation
  forest / autoencoder anomaly score alongside the rule score.
- **Session recording / PAM proxy** for live privileged sessions (e.g. SSH/DB
  session capture) — not implemented, would sit as a separate service that
  writes into the same `AuditLog` table.
- **Multi-factor step-up auth flow**: the risk gate currently blocks with a
  403 when risk is too high; wire this to an actual MFA challenge endpoint.
- **Alembic migrations**: `requirements.txt` includes alembic; no migration
  scripts are set up yet (MVP uses `create_all` on startup).

## Project layout

```
app/
  main.py                    FastAPI app + router wiring
  config.py                  Settings (env-driven)
  database.py                SQLAlchemy engine/session
  models.py                  User, PrivilegedResource, AuditLog, Alert
  schemas.py                 Pydantic request/response models
  core/
    security.py               password hashing + JWT
    rbac.py                    role & risk-based access dependencies
    audit.py                   tamper-evident (hash-chained) audit logging
  detection/
    behavior_analytics.py      the insider-threat scoring engine
  crypto/
    pqc.py                     quantum-proof-crypto-ready vault
  routers/
    auth_router.py             register/login (scores login risk)
    privileged_router.py       RBAC + risk gated privileged actions
    audit_router.py            alerts, audit log review, integrity check
```
