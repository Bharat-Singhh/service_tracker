from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import ActivityLog, EmailLog, AppSettings, Service
from app.schemas.schemas import (
    DashboardStats, SettingsUpdate, SettingsResponse,
    ActivityLogResponse, EmailLogResponse,
    CSVPreviewRow, CSVImportResult,
)
from app.services import domain_service, csv_service

router = APIRouter(tags=["app"])


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    all_services = domain_service.get_all(db)

    healthy       = [s for s in all_services if s.expiry_status == "healthy"]
    expiring_soon = [s for s in all_services if s.expiry_status == "expiring_soon"]
    expired       = [s for s in all_services if s.expiry_status == "expired"]

    # Closest-expiring first, capped at 10 rows for the widget
    expiring_60 = sorted(
        [s for s in all_services if 0 <= s.days_remaining <= 60],
        key=lambda x: x.days_remaining,
    )[:10]

    recently_expired = sorted(
        [s for s in all_services if s.days_remaining < 0],
        key=lambda x: x.days_remaining,
        reverse=True,   # least negative = most recently expired
    )[:10]

    return DashboardStats(
        total            = len(all_services),
        healthy          = len(healthy),
        expiring_soon    = len(expiring_soon),
        expired          = len(expired),
        expiring_next_60 = expiring_60,
        recently_expired = recently_expired,
    )


# ─── CSV Import ───────────────────────────────────────────────────────────────

@router.post("/import/preview", response_model=List[CSVPreviewRow])
async def preview_import(
    file: UploadFile = File(...),
    _: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    try:
        rows = csv_service.preview_csv(contents)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Mark duplicates against live DB data
    for row in rows:
        if row.is_valid:
            existing = domain_service.get_duplicate(db, row.service_name, row.entity_name)
            row.is_duplicate = existing is not None

    return rows


@router.post("/import", response_model=CSVImportResult)
async def import_csv(
    file: UploadFile = File(...),
    on_duplicate: str = Form("skip"),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    contents = await file.read()
    try:
        rows = csv_service.preview_csv(contents)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return csv_service.import_csv(db, rows, on_duplicate=on_duplicate)


@router.get("/export")
def export_csv(db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    csv_bytes = csv_service.export_csv(db)
    return Response(
        content     = csv_bytes,
        media_type  = "text/csv",
        headers     = {"Content-Disposition": "attachment; filename=services_export.csv"},
    )


# ─── Settings ────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db), _: dict = Depends(get_current_user)):
    settings = db.query(AppSettings).first()
    return settings or SettingsResponse()


@router.put("/settings", response_model=SettingsResponse)
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    settings = db.query(AppSettings).first()
    if not settings:
        settings = AppSettings()
        db.add(settings)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)

    db.add(ActivityLog(action="SETTINGS_UPDATE", description="Settings updated"))
    db.commit()
    return settings


# ─── Logs ────────────────────────────────────────────────────────────────────

@router.get("/activity", response_model=List[ActivityLogResponse])
def get_activity(
    limit: int = 200,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()


@router.get("/email-logs", response_model=List[EmailLogResponse])
def get_email_logs(
    limit: int = 200,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    logs = db.query(EmailLog).order_by(EmailLog.sent_at.desc()).limit(limit).all()
    result = []
    for log in logs:
        svc = db.query(Service).filter(Service.id == log.service_id).first()
        entry = EmailLogResponse.model_validate(log)
        entry.service_name = svc.service_name if svc else None
        entry.entity_name  = svc.entity_name  if svc else None
        result.append(entry)
    return result
