"""
service_service.py  (kept filename for minimal import churn — re-exported as domain_service)

Handles all CRUD operations on the Service table plus the expiry-status
computation that runs on every record before it leaves the backend.
"""
from datetime import date, datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import Service, ActivityLog
from app.schemas.schemas import ServiceCreate, ServiceUpdate, ServiceResponse


# ─── Thresholds ──────────────────────────────────────────────────────────────
# A service is "expiring soon" if it expires within the next 60 days.
# This matches the first email reminder window.
EXPIRING_SOON_DAYS = 60


def compute_expiry_status(expiry: date) -> Tuple[str, int]:
    """
    Return (status_label, days_remaining) for a given expiry date.

    days_remaining is negative when the service has already expired.
    """
    today = date.today()
    delta = (expiry - today).days
    if delta < 0:
        return "expired", delta
    elif delta <= EXPIRING_SOON_DAYS:
        return "expiring_soon", delta
    else:
        return "healthy", delta


def enrich(service: Service) -> ServiceResponse:
    """Attach computed expiry_status and days_remaining before returning to the API layer."""
    status, days = compute_expiry_status(service.expiry_date)
    data = ServiceResponse.model_validate(service)
    data.expiry_status = status
    data.days_remaining = days
    return data


# ─── CRUD ────────────────────────────────────────────────────────────────────

def get_all(db: Session) -> List[ServiceResponse]:
    services = db.query(Service).order_by(Service.expiry_date.asc()).all()
    return [enrich(s) for s in services]


def get_by_id(db: Session, service_id: int) -> Optional[Service]:
    return db.query(Service).filter(Service.id == service_id).first()


def get_duplicate(db: Session, service_name: str, entity_name: str) -> Optional[Service]:
    """
    A duplicate is defined as the same (service_name, entity_name) pair —
    case-insensitive.  E.g. two rows for ("Domain", "example.com") would clash.
    """
    return (
        db.query(Service)
        .filter(
            Service.service_name.ilike(service_name.strip()),
            Service.entity_name.ilike(entity_name.strip()),
        )
        .first()
    )


def create_service(db: Session, data: ServiceCreate) -> Service:
    service = Service(**data.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    _log(db, "CREATE_SERVICE", f"Added: {service.service_name} — {service.entity_name}")
    return service


def update_service(db: Session, service_id: int, data: ServiceUpdate) -> Optional[Service]:
    service = get_by_id(db, service_id)
    if not service:
        return None

    updates = []
    for field, value in data.model_dump(exclude_unset=True).items():
        old_value = getattr(service, field)
        if old_value != value:
            updates.append(f"{field}: '{old_value}' → '{value}'")
            setattr(service, field, value)

    if updates:
        service.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(service)
        _log(
            db,
            "UPDATE_SERVICE",
            f"Updated {service.service_name} — {service.entity_name}: " + ", ".join(updates),
        )
    return service


def delete_service(db: Session, service_id: int) -> bool:
    service = get_by_id(db, service_id)
    if not service:
        return False
    label = f"{service.service_name} — {service.entity_name}"
    db.delete(service)
    db.commit()
    _log(db, "DELETE_SERVICE", f"Deleted: {label}")
    return True


def bulk_delete(db: Session, ids: List[int]) -> int:
    count = db.query(Service).filter(Service.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    _log(db, "BULK_DELETE", f"Deleted {count} services")
    return count


def bulk_update(db: Session, ids: List[int], service_provider: Optional[str], status: Optional[str]) -> int:
    services = db.query(Service).filter(Service.id.in_(ids)).all()
    for s in services:
        if service_provider is not None:
            s.service_provider = service_provider
        if status is not None:
            s.status = status
        s.updated_at = datetime.utcnow()
    db.commit()
    _log(db, "BULK_UPDATE", f"Updated {len(services)} services")
    return len(services)


# ─── Internal helper ─────────────────────────────────────────────────────────

def _log(db: Session, action: str, description: str):
    db.add(ActivityLog(action=action, description=description))
    db.commit()
