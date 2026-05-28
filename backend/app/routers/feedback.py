"""Feedback on a recommendation (1-5 rating + useful flag + comment)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=schemas.FeedbackOut)
def submit_feedback(
    body: schemas.FeedbackIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.FeedbackOut:
    # Ensure the recommendation belongs to this user
    rec = db.get(models.Recommendation, body.recommendation_id)
    if not rec or rec.user_id != user.id:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    existing = (
        db.query(models.Feedback)
        .filter(models.Feedback.recommendation_id == body.recommendation_id)
        .filter(models.Feedback.user_id == user.id)
        .one_or_none()
    )
    if existing:
        existing.rating = body.rating
        existing.was_useful = body.was_useful
        existing.comment = body.comment or None
        db.commit()
        db.refresh(existing)
        return schemas.FeedbackOut.model_validate(existing)

    fb = models.Feedback(
        recommendation_id=body.recommendation_id,
        user_id=user.id,
        rating=body.rating,
        was_useful=body.was_useful,
        comment=body.comment or None,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return schemas.FeedbackOut.model_validate(fb)


@router.get("/{recommendation_id}", response_model=schemas.FeedbackOut | None)
def get_feedback(
    recommendation_id: uuid.UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.FeedbackOut | None:
    fb = (
        db.query(models.Feedback)
        .filter(models.Feedback.recommendation_id == recommendation_id)
        .filter(models.Feedback.user_id == user.id)
        .one_or_none()
    )
    if not fb:
        return None
    return schemas.FeedbackOut.model_validate(fb)
