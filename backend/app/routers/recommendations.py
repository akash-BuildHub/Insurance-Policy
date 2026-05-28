"""Recommendation endpoints — run, list, fetch by id."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, recommendation, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("", response_model=schemas.RunRecommendationResponse)
def run(
    body: schemas.UserProfileIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.RunRecommendationResponse:
    # Persist latest profile snapshot (upsert)
    p = db.get(models.UserProfile, user.id)
    payload = body.model_dump()
    if p is None:
        p = models.UserProfile(user_id=user.id, **payload)
        db.add(p)
    else:
        for k, v in payload.items():
            setattr(p, k, v)

    # Compute recommendation
    policies = (
        db.query(models.Policy).options(joinedload(models.Policy.company)).all()
    )
    result = recommendation.run_recommendation(payload, policies)
    risk = result["risk"]
    top = result["scored"][:3]

    rec = models.Recommendation(
        user_id=user.id,
        profile_snapshot=payload,
        risk_level=risk["level"],
        risk_score=risk["score"],
    )
    db.add(rec)
    db.flush()

    for s in top:
        db.add(
            models.RecommendationItem(
                recommendation_id=rec.id,
                policy_id=uuid.UUID(s["policy"]["id"]),
                score=s["score"],
                rank=s["rank"],
                reason=s["reason"],
                factor_breakdown=s["factors"],
            )
        )
    db.commit()
    db.refresh(rec)
    return schemas.RunRecommendationResponse(recommendation_id=rec.id, top_count=len(top))


@router.get("", response_model=list[schemas.RecommendationSummary])
def list_mine(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[schemas.RecommendationSummary]:
    rows = (
        db.query(models.Recommendation)
        .filter(models.Recommendation.user_id == user.id)
        .order_by(models.Recommendation.created_at.desc())
        .limit(50)
        .all()
    )
    return [schemas.RecommendationSummary.model_validate(r) for r in rows]


@router.get("/{recommendation_id}", response_model=schemas.RecommendationOut)
def get_one(
    recommendation_id: uuid.UUID,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.RecommendationOut:
    rec = (
        db.query(models.Recommendation)
        .options(
            joinedload(models.Recommendation.items)
            .joinedload(models.RecommendationItem.policy)
            .joinedload(models.Policy.company)
        )
        .filter(models.Recommendation.id == recommendation_id)
        .filter(models.Recommendation.user_id == user.id)
        .one_or_none()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    return schemas.RecommendationOut.model_validate(rec)
