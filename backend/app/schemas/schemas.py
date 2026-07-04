from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ─── Service ─────────────────────────────────────────────────────────────────

class ServiceBase(BaseModel):
    # Required
    service_name:     str
    entity_name:      str
    expiry_date:      date

    # Optional
    location:         Optional[str]     = None
    start_date:       Optional[date]    = None
    status:           Optional[str]     = None   # user-supplied label (separate from computed expiry status)
    service_provider: Optional[str]     = None
    account_details:  Optional[str]     = None
    contact_details:  Optional[str]     = None
    nda_status:       Optional[str]     = None
    nda_expire_date:  Optional[date]    = None
    cost:             Optional[Decimal] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    """All fields optional — only supplied fields are updated (PATCH semantics)."""
    service_name:     Optional[str]     = None
    entity_name:      Optional[str]     = None
    expiry_date:      Optional[date]    = None
    location:         Optional[str]     = None
    start_date:       Optional[date]    = None
    status:           Optional[str]     = None
    service_provider: Optional[str]     = None
    account_details:  Optional[str]     = None
    contact_details:  Optional[str]     = None
    nda_status:       Optional[str]     = None
    nda_expire_date:  Optional[date]    = None
    cost:             Optional[Decimal] = None


class ServiceResponse(ServiceBase):
    id:         int
    created_at: datetime
    updated_at: datetime

    # Computed by the service layer — never stored in DB
    expiry_status:     Optional[str] = None   # "healthy" | "expiring_soon" | "expired"
    days_remaining:    Optional[int] = None

    model_config = {"from_attributes": True}


class BulkDeleteRequest(BaseModel):
    ids: List[int]


class BulkUpdateRequest(BaseModel):
    ids:              List[int]
    service_provider: Optional[str] = None
    status:           Optional[str] = None


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total:            int
    healthy:          int
    expiring_soon:    int   # expiring within next 60 days
    expired:          int
    expiring_next_60: List[ServiceResponse]
    recently_expired: List[ServiceResponse]


# ─── Settings ────────────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    smtp_host:         Optional[str]  = None
    smtp_port:         Optional[int]  = 587
    smtp_username:     Optional[str]  = None
    smtp_password:     Optional[str]  = None
    smtp_from:         Optional[str]  = None
    recipients:        Optional[str]  = None
    scheduler_enabled: Optional[bool] = True


class SettingsResponse(BaseModel):
    smtp_host:         Optional[str]  = None
    smtp_port:         Optional[int]  = 587
    smtp_username:     Optional[str]  = None
    smtp_from:         Optional[str]  = None
    recipients:        Optional[str]  = None
    scheduler_enabled: Optional[bool] = True

    model_config = {"from_attributes": True}


# ─── Activity Log ────────────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id:          int
    action:      str
    description: Optional[str] = None
    created_at:  datetime

    model_config = {"from_attributes": True}


# ─── Email Log ───────────────────────────────────────────────────────────────

class EmailLogResponse(BaseModel):
    id:           int
    service_id:   int
    email_type:   str
    days_before:  int
    recipient:    str
    status:       str
    error_message: Optional[str] = None
    sent_at:      datetime
    service_name: Optional[str] = None
    entity_name:  Optional[str] = None

    model_config = {"from_attributes": True}


# ─── CSV Import ──────────────────────────────────────────────────────────────

class CSVImportResult(BaseModel):
    imported: int
    updated:  int
    skipped:  int
    invalid:  int
    errors:   List[str] = []


class CSVPreviewRow(BaseModel):
    row:              int
    service_name:     str
    entity_name:      str
    expiry_date:      str
    location:         Optional[str] = None
    start_date:       Optional[str] = None
    status:           Optional[str] = None
    service_provider: Optional[str] = None
    account_details:  Optional[str] = None
    contact_details:  Optional[str] = None
    nda_status:       Optional[str] = None
    nda_expire_date:  Optional[str] = None
    cost:             Optional[str] = None
    is_duplicate:     bool = False
    is_valid:         bool = True
    error:            Optional[str] = None
