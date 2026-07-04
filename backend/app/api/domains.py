from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.schemas import ServiceCreate, ServiceUpdate, ServiceResponse, BulkDeleteRequest, BulkUpdateRequest
from app.services import domain_service

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=List[ServiceResponse])
def list_services(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    services = domain_service.get_all(db)

    if search:
        s = search.lower()
        services = [
            svc for svc in services
            if s in (svc.service_name     or "").lower()
            or s in (svc.entity_name      or "").lower()
            or s in (svc.service_provider or "").lower()
            or s in (svc.location         or "").lower()
            or s in (svc.account_details  or "").lower()
            or s in (svc.contact_details  or "").lower()
        ]

    if status_filter and status_filter != "all":
        services = [svc for svc in services if svc.expiry_status == status_filter]

    return services


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    existing = domain_service.get_duplicate(db, data.service_name, data.entity_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Service '{data.service_name} — {data.entity_name}' already exists.",
        )
    service = domain_service.create_service(db, data)
    return domain_service.enrich(service)


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    service = domain_service.update_service(db, service_id, data)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return domain_service.enrich(service)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    if not domain_service.delete_service(db, service_id):
        raise HTTPException(status_code=404, detail="Service not found")


@router.post("/bulk-delete")
def bulk_delete(
    data: BulkDeleteRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    count = domain_service.bulk_delete(db, data.ids)
    return {"deleted": count}


@router.post("/bulk-update")
def bulk_update(
    data: BulkUpdateRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    count = domain_service.bulk_update(db, data.ids, data.service_provider, data.status)
    return {"updated": count}
