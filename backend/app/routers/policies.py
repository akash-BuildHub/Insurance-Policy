"""Insurance policies — public read, admin write."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import require_admin

router = APIRouter(prefix="/api/policies", tags=["policies"])


@router.get("", response_model=list[schemas.PolicyOut])
def list_policies(db: Session = Depends(get_db)) -> list[schemas.PolicyOut]:
    rows = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.company))
        .order_by(models.Policy.premium_monthly)
        .all()
    )
    return [schemas.PolicyOut.model_validate(r) for r in rows]


@router.get("/{policy_id}", response_model=schemas.PolicyOut)
def get_policy(policy_id: uuid.UUID, db: Session = Depends(get_db)) -> schemas.PolicyOut:
    p = (
        db.query(models.Policy)
        .options(joinedload(models.Policy.company))
        .filter(models.Policy.id == policy_id)
        .one_or_none()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    return schemas.PolicyOut.model_validate(p)


@router.post("", response_model=schemas.PolicyOut, status_code=status.HTTP_201_CREATED)
def create_policy(
    body: schemas.PolicyIn,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.PolicyOut:
    if not db.get(models.Company, body.company_id):
        raise HTTPException(status_code=400, detail="Unknown company_id")
    p = models.Policy(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return schemas.PolicyOut.model_validate(p)


@router.put("/{policy_id}", response_model=schemas.PolicyOut)
def update_policy(
    policy_id: uuid.UUID,
    body: schemas.PolicyIn,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> schemas.PolicyOut:
    p = db.get(models.Policy, policy_id)
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    if not db.get(models.Company, body.company_id):
        raise HTTPException(status_code=400, detail="Unknown company_id")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return schemas.PolicyOut.model_validate(p)


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    policy_id: uuid.UUID,
    _: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    p = db.get(models.Policy, policy_id)
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(p)
    db.commit()
