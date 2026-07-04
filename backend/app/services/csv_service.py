import io
import pandas as pd
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.models import Service, ActivityLog
from app.schemas.schemas import CSVPreviewRow, CSVImportResult

# ─── Column mapping ──────────────────────────────────────────────────────────
# Accept both the exact header names AND common aliases.
# Keys = what we normalise TO, Values = aliases we accept FROM the CSV.
COLUMN_ALIASES = {
    "service_name":     ["service name", "service"],
    "entity_name":      ["entity name", "entity"],
    "expiry_date":      ["expiration date", "expiry date", "expiration", "expiry"],
    "location":         ["location"],
    "start_date":       ["start date", "start"],
    "status":           ["status"],
    "service_provider": ["service provider", "provider"],
    "account_details":  ["account details", "account"],
    "contact_details":  ["contact details", "contact"],
    "nda_status":       ["nda status", "nda"],
    "nda_expire_date":  ["nda expire date", "nda expiry", "nda expiration"],
    "cost":             ["cost", "price", "amount"],
}

REQUIRED_COLUMNS = {"service_name", "entity_name", "expiry_date"}

DATE_FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"]


def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Rename CSV headers to our internal snake_case names using COLUMN_ALIASES."""
    rename_map = {}
    lowered = {c.lower().strip(): c for c in df.columns}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in [canonical] + aliases:
            if alias.lower() in lowered:
                rename_map[lowered[alias.lower()]] = canonical
                break
    return df.rename(columns=rename_map)


def _parse_date(val) -> Tuple[Optional[date], bool]:
    """Try multiple date formats. Returns (date | None, success_bool)."""
    if val is None or (isinstance(val, float) and pd.isna(val)) or str(val).strip() == "":
        return None, False
    for fmt in DATE_FORMATS:
        try:
            return pd.to_datetime(str(val).strip(), format=fmt).date(), True
        except Exception:
            continue
    return None, False


def _safe_str(val) -> Optional[str]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s else None


def _safe_decimal(val) -> Optional[Decimal]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        cleaned = str(val).replace(",", "").replace("$", "").strip()
        return Decimal(cleaned) if cleaned else None
    except InvalidOperation:
        return None


def preview_csv(file_bytes: bytes) -> List[CSVPreviewRow]:
    """
    Parse raw CSV bytes → list of CSVPreviewRow (with validation flags).
    No database writes happen here.
    """
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Could not parse CSV file: {exc}")

    df = _normalise_columns(df)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(
            f"Missing required column(s): {', '.join(sorted(missing))}. "
            f"Required: service_name, entity_name, expiry_date"
        )

    # Ensure optional columns exist (as NaN) so .get() works uniformly
    for col in COLUMN_ALIASES:
        if col not in df.columns:
            df[col] = None

    rows: List[CSVPreviewRow] = []
    for i, row in df.iterrows():
        preview = CSVPreviewRow(
            row              = int(i) + 2,   # +1 for header, +1 for 1-index
            service_name     = _safe_str(row.get("service_name")) or "",
            entity_name      = _safe_str(row.get("entity_name"))  or "",
            expiry_date      = _safe_str(row.get("expiry_date"))   or "",
            location         = _safe_str(row.get("location")),
            start_date       = _safe_str(row.get("start_date")),
            status           = _safe_str(row.get("status")),
            service_provider = _safe_str(row.get("service_provider")),
            account_details  = _safe_str(row.get("account_details")),
            contact_details  = _safe_str(row.get("contact_details")),
            nda_status       = _safe_str(row.get("nda_status")),
            nda_expire_date  = _safe_str(row.get("nda_expire_date")),
            cost             = _safe_str(row.get("cost")),
            is_valid         = True,
        )

        errors = []
        if not preview.service_name:
            errors.append("service_name is required")
        if not preview.entity_name:
            errors.append("entity_name is required")

        _, expiry_ok = _parse_date(preview.expiry_date)
        if not expiry_ok:
            errors.append(f"invalid expiry_date: '{preview.expiry_date}'")

        if preview.start_date:
            _, start_ok = _parse_date(preview.start_date)
            if not start_ok:
                errors.append(f"invalid start_date: '{preview.start_date}'")

        if preview.nda_expire_date:
            _, nda_ok = _parse_date(preview.nda_expire_date)
            if not nda_ok:
                errors.append(f"invalid nda_expire_date: '{preview.nda_expire_date}'")

        if preview.cost:
            if _safe_decimal(preview.cost) is None:
                errors.append(f"invalid cost: '{preview.cost}' (expected a number)")

        if errors:
            preview.is_valid = False
            preview.error = "; ".join(errors)

        rows.append(preview)

    return rows


def import_csv(
    db: Session,
    rows: List[CSVPreviewRow],
    on_duplicate: str = "skip",   # "skip" | "update"
) -> CSVImportResult:
    """
    Commit validated preview rows to the database.
    on_duplicate controls what happens when (service_name, entity_name) already exists.
    """
    imported = updated = skipped = invalid = 0
    errors: List[str] = []

    for row in rows:
        if not row.is_valid:
            invalid += 1
            errors.append(f"Row {row.row}: {row.error}")
            continue

        expiry_date, _      = _parse_date(row.expiry_date)
        start_date, _       = _parse_date(row.start_date)       if row.start_date       else (None, True)
        nda_expire_date, _  = _parse_date(row.nda_expire_date)  if row.nda_expire_date  else (None, True)
        cost                = _safe_decimal(row.cost)           if row.cost              else None

        # Duplicate check — same (service_name, entity_name) case-insensitively
        existing = (
            db.query(Service)
            .filter(
                Service.service_name.ilike(row.service_name.strip()),
                Service.entity_name.ilike(row.entity_name.strip()),
            )
            .first()
        )

        if existing:
            if on_duplicate == "update":
                existing.expiry_date      = expiry_date
                existing.location         = _safe_str(row.location)
                existing.start_date       = start_date
                existing.status           = _safe_str(row.status)
                existing.service_provider = _safe_str(row.service_provider)
                existing.account_details  = _safe_str(row.account_details)
                existing.contact_details  = _safe_str(row.contact_details)
                existing.nda_status       = _safe_str(row.nda_status)
                existing.nda_expire_date  = nda_expire_date
                existing.cost             = cost
                db.commit()
                updated += 1
            else:
                skipped += 1
        else:
            db.add(Service(
                service_name     = row.service_name.strip(),
                entity_name      = row.entity_name.strip(),
                expiry_date      = expiry_date,
                location         = _safe_str(row.location),
                start_date       = start_date,
                status           = _safe_str(row.status),
                service_provider = _safe_str(row.service_provider),
                account_details  = _safe_str(row.account_details),
                contact_details  = _safe_str(row.contact_details),
                nda_status       = _safe_str(row.nda_status),
                nda_expire_date  = nda_expire_date,
                cost             = cost,
            ))
            db.commit()
            imported += 1

    db.add(ActivityLog(
        action      = "CSV_IMPORT",
        description = f"Imported {imported}, Updated {updated}, Skipped {skipped}, Invalid {invalid}",
    ))
    db.commit()

    return CSVImportResult(
        imported = imported,
        updated  = updated,
        skipped  = skipped,
        invalid  = invalid,
        errors   = errors,
    )


def export_csv(db: Session) -> bytes:
    """Export all services as UTF-8 CSV bytes."""
    services = db.query(Service).order_by(Service.service_name.asc(), Service.entity_name.asc()).all()
    rows = []
    for s in services:
        rows.append({
            "Service Name":     s.service_name,
            "Entity Name":      s.entity_name,
            "Location":         s.location         or "",
            "Start Date":       str(s.start_date)  if s.start_date  else "",
            "Expiration Date":  str(s.expiry_date),
            "Status":           s.status            or "",
            "Service Provider": s.service_provider  or "",
            "Account Details":  s.account_details   or "",
            "Contact Details":  s.contact_details   or "",
            "NDA Status":       s.nda_status         or "",
            "NDA Expire Date":  str(s.nda_expire_date) if s.nda_expire_date else "",
            "Cost":             str(s.cost)          if s.cost is not None else "",
        })

    df = pd.DataFrame(rows)
    buf = io.StringIO()
    df.to_csv(buf, index=False)

    db.add(ActivityLog(action="CSV_EXPORT", description=f"Exported {len(rows)} services"))
    db.commit()

    return buf.getvalue().encode("utf-8")
