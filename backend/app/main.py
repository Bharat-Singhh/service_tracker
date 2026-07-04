from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from contextlib import asynccontextmanager
import logging

from app.core.database import engine, SessionLocal
from app.core.config import settings
from app.core.security import hash_password
from app.models.models import Base, User, AppSettings
from app.api import auth, domains
from app.api.app_routes import router as app_router
from app.services.email_service import run_reminder_check

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def sync_env_settings_to_db(db):
    row = db.query(AppSettings).first()
    if not row:
        return

    changed = False
    mapping = {
        "smtp_host":     settings.SMTP_HOST,
        "smtp_port":     settings.SMTP_PORT,
        "smtp_username": settings.SMTP_USERNAME,
        "smtp_password": settings.SMTP_PASSWORD,
        "smtp_from":     settings.SMTP_FROM,
        "recipients":    settings.RECIPIENTS,
    }

    for field, env_value in mapping.items():
        if env_value is None:
            continue
        current = getattr(row, field)
        if field == "smtp_port":
            if current != env_value:
                setattr(row, field, env_value)
                changed = True
        elif str(current or "") != str(env_value).strip():
            setattr(row, field, str(env_value).strip())
            changed = True

    if changed:
        db.commit()
        logger.info("AppSettings updated from environment variables.")


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == settings.ADMIN_USERNAME).first():
            db.add(User(
                username        = settings.ADMIN_USERNAME,
                hashed_password = hash_password(settings.ADMIN_PASSWORD),
            ))
            db.commit()
            logger.info(f"Admin user '{settings.ADMIN_USERNAME}' created.")

        if not db.query(AppSettings).first():
            db.add(AppSettings())
            db.commit()
            logger.info("Default settings row created.")

        sync_env_settings_to_db(db)
    finally:
        db.close()


def run_scheduler_job():
    db = SessionLocal()
    try:
        run_reminder_check(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        run_scheduler_job,
        CronTrigger(hour=13, minute=20),
        id="daily_reminder",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — daily reminder check at 12:50.")
    yield
    scheduler.shutdown()
    logger.info("APScheduler stopped.")


app = FastAPI(title="Service Tracker API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(domains.router)   # mounted at /services
app.include_router(app_router)


@app.get("/health")
def health():
    return {"status": "ok"}
