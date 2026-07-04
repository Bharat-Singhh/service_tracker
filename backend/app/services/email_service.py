import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date
from typing import List
from sqlalchemy.orm import Session

from app.core.config import settings as env_settings
from app.models.models import Service, EmailLog, AppSettings, ActivityLog


# Reminder milestones in days-before-expiry order (earliest first)
REMINDER_DAYS: List[int] = [60, 30, 7, 1]


def get_settings(db: Session) -> AppSettings:
    cfg = db.query(AppSettings).first()
    if not cfg:
        return None

    if not cfg.smtp_host and env_settings.SMTP_HOST:
        cfg.smtp_host = env_settings.SMTP_HOST
    if not cfg.smtp_port and env_settings.SMTP_PORT:
        cfg.smtp_port = env_settings.SMTP_PORT
    if not cfg.smtp_username and env_settings.SMTP_USERNAME:
        cfg.smtp_username = env_settings.SMTP_USERNAME
    if not cfg.smtp_password and env_settings.SMTP_PASSWORD:
        cfg.smtp_password = env_settings.SMTP_PASSWORD
    if not cfg.smtp_from and env_settings.SMTP_FROM:
        cfg.smtp_from = env_settings.SMTP_FROM
    if not cfg.recipients and env_settings.RECIPIENTS:
        cfg.recipients = env_settings.RECIPIENTS

    return cfg


def already_sent(db: Session, service_id: int, email_type: str, recipient: str) -> bool:
    """Return True only when this reminder has already been successfully delivered."""
    return (
        db.query(EmailLog)
        .filter(
            EmailLog.service_id == service_id,
            EmailLog.email_type == email_type,
            EmailLog.recipient  == recipient,
            EmailLog.status     == "sent",
        )
        .first()
        is not None
    )


def log_email(db: Session, service_id: int, email_type: str, days_before: int, recipient: str, status: str, error_message: str | None = None):
    """Persist an email attempt record and record activity for success or failure."""
    db.add(EmailLog(
        service_id    = service_id,
        email_type    = email_type,
        days_before   = days_before,
        recipient     = recipient,
        status        = status,
        error_message = error_message,
    ))
    db.add(ActivityLog(
        action      = "EMAIL_SENT" if status == "sent" else "EMAIL_FAILED",
        description = (
            f"{status.upper()} {email_type} to {recipient} for service_id={service_id}"
            + (f": {error_message}" if error_message else "")
        ),
    ))
    db.commit()


def build_html_email(service: Service, days_remaining: int) -> str:
    """Render a clean, minimal HTML reminder email."""
    if days_remaining <= 0:
        urgency_label = "⛔ ALREADY EXPIRED"
        urgency_color = "#dc2626"
    elif days_remaining == 1:
        urgency_label = "⚠️ EXPIRES TOMORROW"
        urgency_color = "#dc2626"
    elif days_remaining <= 7:
        urgency_label = f"⚠️ {days_remaining} days remaining"
        urgency_color = "#ea580c"
    else:
        urgency_label = f"📅 {days_remaining} days remaining"
        urgency_color = "#ca8a04"

    optional_rows = ""
    if service.location:
        optional_rows += f"<tr style='border-bottom:1px solid #f3f4f6;'><td style='padding:10px 0;color:#6b7280;width:160px;'>Location</td><td style='padding:10px 0;color:#111827;'>{service.location}</td></tr>"
    if service.service_provider:
        optional_rows += f"<tr style='border-bottom:1px solid #f3f4f6;'><td style='padding:10px 0;color:#6b7280;'>Service Provider</td><td style='padding:10px 0;color:#111827;'>{service.service_provider}</td></tr>"
    if service.nda_status:
        optional_rows += f"<tr style='border-bottom:1px solid #f3f4f6;'><td style='padding:10px 0;color:#6b7280;'>NDA Status</td><td style='padding:10px 0;color:#111827;'>{service.nda_status}</td></tr>"
    if service.nda_expire_date:
        optional_rows += f"<tr style='border-bottom:1px solid #f3f4f6;'><td style='padding:10px 0;color:#6b7280;'>NDA Expiry</td><td style='padding:10px 0;color:#111827;'>{service.nda_expire_date.strftime('%B %d, %Y')}</td></tr>"
    if service.cost is not None:
        optional_rows += f"<tr style='border-bottom:1px solid #f3f4f6;'><td style='padding:10px 0;color:#6b7280;'>Cost</td><td style='padding:10px 0;color:#111827;'>${service.cost:,.2f}</td></tr>"
    if service.contact_details:
        optional_rows += f"<tr style='border-bottom:1px solid #f3f4f6;'><td style='padding:10px 0;color:#6b7280;'>Contact</td><td style='padding:10px 0;color:#111827;'>{service.contact_details}</td></tr>"
    if service.account_details:
        optional_rows += f"<tr><td style='padding:10px 0;color:#6b7280;'>Account Details</td><td style='padding:10px 0;color:#111827;'>{service.account_details}</td></tr>"

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
      <h2 style="margin:0;font-size:18px;font-weight:600;color:#111827;">Service Expiry Reminder</h2>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#374151;">
        The following service is expiring and requires your attention.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 0;color:#6b7280;width:160px;">Service</td>
          <td style="padding:10px 0;font-weight:600;color:#111827;">{service.service_name}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 0;color:#6b7280;">Entity</td>
          <td style="padding:10px 0;font-weight:600;color:#111827;">{service.entity_name}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 0;color:#6b7280;">Expiry Date</td>
          <td style="padding:10px 0;color:#111827;">{service.expiry_date.strftime('%B %d, %Y')}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 0;color:#6b7280;">Status</td>
          <td style="padding:10px 0;font-weight:700;color:{urgency_color};">{urgency_label}</td>
        </tr>
        {optional_rows}
      </table>
      <div style="margin-top:32px;padding:16px;background:#fef3c7;border-radius:6px;border:1px solid #fde68a;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          Please renew or take action on this service before it expires to avoid disruption.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Service Tracker — Automated Reminder</p>
    </div>
  </div>
</body>
</html>"""


def send_email(settings: AppSettings, recipient: str, subject: str, html_body: str) -> tuple[bool, str | None]:
    """Deliver a single HTML email via Outlook SMTP and return success/failure details."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = settings.smtp_from or settings.smtp_username
        msg["To"]      = recipient
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            if not settings.smtp_username or not settings.smtp_password:
                return False, "SMTP credentials not configured"
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(msg["From"], [recipient], msg.as_string())
        return True, None
    except Exception as exc:
        error_msg = str(exc)
        print(f"[EMAIL ERROR] {error_msg}")
        return False, error_msg


def run_reminder_check(db: Session):
    """
    Called once daily at 08:00 by APScheduler.

    For each service, check whether today's date is exactly 60, 30, 7, or 1
    day(s) before the expiry_date.  If it is, and the email hasn't already
    been sent (already_sent() returns False), send the reminder and record it.
    """
    cfg = get_settings(db)
    if not cfg or not cfg.smtp_host or not cfg.recipients:
        print("[SCHEDULER] Email not configured — skipping reminder check.")
        return

    recipients = [r.strip() for r in cfg.recipients.split(",") if r.strip()]
    today      = date.today()
    services   = db.query(Service).all()
    sent_count = 0

    for service in services:
        days_left  = (service.expiry_date - today).days

        for days_before in REMINDER_DAYS:
            if days_left != days_before:
                continue  # today is not the trigger date for this milestone

            email_type = f"expiry_{days_before}d"
            subject    = (
                f"[{days_before}d Reminder] {service.service_name} — "
                f"{service.entity_name} expires in {days_before} day{'s' if days_before > 1 else ''}"
            )
            html = build_html_email(service, days_before)

            for recipient in recipients:
                if already_sent(db, service.id, email_type, recipient):
                    print(f"[SCHEDULER] Already sent {email_type} to {recipient} for #{service.id} — skipping.")
                    continue

                success, error_msg = send_email(cfg, recipient, subject, html)
                log_email(
                    db,
                    service.id,
                    email_type,
                    days_before,
                    recipient,
                    status = "sent" if success else "failed",
                    error_message = error_msg,
                )
                if success:
                    sent_count += 1

    print(f"[SCHEDULER] Reminder check complete — {sent_count} email(s) sent across {len(services)} services.")
