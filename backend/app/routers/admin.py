"""Admin-only analytics and user/recommendation listing."""
from __future__ import annotations

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/analytics", response_model=schemas.AdminAnalytics)
def analytics(
    _: models.User = Depends(require_admin), db: Session = Depends(get_db)
) -> schemas.AdminAnalytics:
    totals = schemas.AdminTotals(
        users=db.query(models.User).count(),
        companies=db.query(models.Company).count(),
        policies=db.query(models.Policy).count(),
        recommendations=db.query(models.Recommendation).count(),
        feedback=db.query(models.Feedback).count(),
    )

    # Most-recommended policies (across all recommendation_items)
    rows = (
        db.query(
            models.RecommendationItem.policy_id,
            models.Policy.name,
            models.Company.name.label("company_name"),
            func.count().label("cnt"),
        )
        .join(models.Policy, models.Policy.id == models.RecommendationItem.policy_id)
        .join(models.Company, models.Company.id == models.Policy.company_id)
        .group_by(
            models.RecommendationItem.policy_id, models.Policy.name, models.Company.name
        )
        .order_by(func.count().desc())
        .limit(5)
        .all()
    )
    most_recommended = [
        schemas.MostRecommendedItem(id=r[0], name=r[1], company=r[2], count=r[3])
        for r in rows
    ]

    risk_rows = db.query(models.Recommendation.risk_level).all()
    counts = Counter(r[0] for r in risk_rows)
    risk_dist = {
        "Low": counts.get("Low", 0),
        "Medium": counts.get("Medium", 0),
        "High": counts.get("High", 0),
    }

    return schemas.AdminAnalytics(
        totals=totals, most_recommended=most_recommended, risk_distribution=risk_dist
    )


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    _: models.User = Depends(require_admin), db: Session = Depends(get_db)
) -> list[schemas.UserOut]:
    rows = db.query(models.User).order_by(models.User.created_at.desc()).limit(500).all()
    return [schemas.UserOut.model_validate(r) for r in rows]


@router.get("/recommendations", response_model=list[schemas.AdminRecommendationRow])
def list_recommendations(
    _: models.User = Depends(require_admin), db: Session = Depends(get_db)
) -> list[schemas.AdminRecommendationRow]:
    rows = (
        db.query(models.Recommendation)
        .order_by(models.Recommendation.created_at.desc())
        .limit(200)
        .all()
    )
    return [schemas.AdminRecommendationRow.model_validate(r) for r in rows]
