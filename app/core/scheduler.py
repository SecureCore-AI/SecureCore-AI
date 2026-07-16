"""
Automatic baseline recalculation.

This is what makes the behavioural model "self-training" in a lightweight
sense: each user's normal activity volume/pattern is recomputed on a
schedule from their own recent history, so the detection engine's
definition of "normal" keeps up with legitimate changes in a person's job
(e.g. someone moved to a new team and now legitimately does more DB
exports). It is NOT a machine-learning model with weights being trained --
see the note in app/detection/behavior_analytics.py for how to add one.

Wire this up in app/main.py with:

    from app.core.scheduler import start_scheduler
    start_scheduler()

Requires: pip install apscheduler
"""
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models import User
from app.detection.behavior_analytics import update_baseline

_scheduler = BackgroundScheduler()


def recompute_all_baselines():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            update_baseline(db, user)
        print(f"[scheduler] Recomputed behavioural baselines for {len(users)} users.")
    finally:
        db.close()


def start_scheduler():
    # Runs once every 24h. Change to cron-style for a specific time, e.g.:
    # _scheduler.add_job(recompute_all_baselines, "cron", hour=2)  # 2am daily
    _scheduler.add_job(recompute_all_baselines, "interval", hours=24, id="baseline_recalc")
    _scheduler.start()
