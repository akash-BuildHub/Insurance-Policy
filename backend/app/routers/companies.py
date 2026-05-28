"""Insurance companies — public read, admin write."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import require_admin

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=list[schemas.CompanyOut])
def list_companies(db: Session = Depends(get_db)) -> list[schemas.CompanyOut]:
    rows = db.query(models.Company).order_by(models.Company.name).all()
    return [schemas.CompanyOut.model_validate(r) for r in rows]


@router.post("", response_model=schemas.CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    body: schemas.CompanyIn,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.CompanyOut:
    c = models.Company(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return schemas.CompanyOut.model_validate(c)


@router.put("/{company_id}", response_model=schemas.CompanyOut)
def update_company(
    company_id: uuid.UUID,
    body: schemas.CompanyIn,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.CompanyOut:
    c = db.get(models.Company, company_id)
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return schemas.CompanyOut.model_validate(c)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: uuid.UUID,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    c = db.get(models.Company, company_id)
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(c)
    db.commit()
