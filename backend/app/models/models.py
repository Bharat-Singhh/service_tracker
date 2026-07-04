from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Service(Base):
    """
    Central table — tracks any service (domain, SSL cert, software licence,
    NDA, vendor contract, etc.) that has an expiry date.

    Required fields  : service_name, entity_name, expiry_date
    Optional fields  : everything else
    """
    __tablename__ = "services"

    id               = Column(Integer, primary_key=True, index=True)

    # ── Required ───────────────────────────────────────────────────────────
    service_name     = Column(String(255), nullable=False, index=True)   # e.g. "Domain", "SSL", "NDA"
    entity_name      = Column(String(255), nullable=False, index=True)   # e.g. "example.com", "Vendor X"
    expiry_date      = Column(Date, nullable=False)

    # ── Optional ───────────────────────────────────────────────────────────
    location         = Column(String(255), nullable=True)                # datacenter / geography
    start_date       = Column(Date, nullable=True)
    status           = Column(String(100), nullable=True)                # user-supplied status label
    service_provider = Column(String(255), nullable=True)                # Cloudflare, GoDaddy, AWS…
    account_details  = Column(Text, nullable=True)                       # login / account ID notes
    contact_details  = Column(Text, nullable=True)                       # account manager, phone…
    nda_status       = Column(String(100), nullable=True)                # "Signed", "Pending", "N/A"
    nda_expire_date  = Column(Date, nullable=True)
    cost             = Column(Numeric(12, 2), nullable=True)             # annual / contract cost

    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    email_logs = relationship("EmailLog", back_populates="service", cascade="all, delete-orphan")


class EmailLog(Base):
    """
    Tracks every reminder email attempt, including both successful sends and
    failures.  Only successful sent emails are treated as completed reminders
    for duplicate-prevention.
    """
    __tablename__ = "email_logs"

    id            = Column(Integer, primary_key=True, index=True)
    service_id    = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    email_type    = Column(String(50), nullable=False)   # "expiry_60d" | "expiry_30d" | "expiry_7d" | "expiry_1d"
    days_before   = Column(Integer, nullable=False)       # 60 | 30 | 7 | 1
    recipient     = Column(String(255), nullable=False)
    status        = Column(String(50), nullable=False, default="sent")
    error_message = Column(Text, nullable=True)
    sent_at       = Column(DateTime(timezone=True), server_default=func.now())

    service = relationship("Service", back_populates="email_logs")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id          = Column(Integer, primary_key=True, index=True)
    action      = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class AppSettings(Base):
    __tablename__ = "app_settings"

    id                = Column(Integer, primary_key=True, index=True)
    smtp_host         = Column(String(255), nullable=True)
    smtp_port         = Column(Integer, default=587)
    smtp_username     = Column(String(255), nullable=True)
    smtp_password     = Column(String(255), nullable=True)
    smtp_from         = Column(String(255), nullable=True)
    recipients        = Column(Text, nullable=True)         # comma-separated
    scheduler_enabled = Column(Boolean, default=True)
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
