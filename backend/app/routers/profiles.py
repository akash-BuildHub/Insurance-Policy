"""User profile (health questionnaire) — upsert + read."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=schemas.UserProfileOut | None)
def get_my_profile(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
) -> schemas.UserProfileOut | None:
    p = db.get(models.UserProfile, user.id)
    if not p:
        return None
    return schemas.UserProfileOut.model_validate(p)


@router.put("", response_model=schemas.UserProfileOut)
def upsert_my_profile(
    body: schemas.UserProfileIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.UserProfileOut:
    p = db.get(models.UserProfile, user.id)
    payload = body.model_dump()
    if p is None:
        p = models.UserProfile(user_id=user.id, **payload)
        db.add(p)
    else:
        for k, v in payload.items():
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return schemas.UserProfileOut.model_validate(p)
