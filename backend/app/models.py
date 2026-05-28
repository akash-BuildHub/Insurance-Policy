"""SQLAlchemy ORM models for the AI Insurance Policy database."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Role(str, enum.Enum):
    user = "user"
    admin = "admin"


# ---------------------------------------------------------------------
# Users + roles
# ---------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False, index=True)
    full_name: Mapped[str | None] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role, name="role"), default=Role.user, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["UserProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    feedback: Mapped[list["Feedback"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------
# User health/finance profile (one-per-user, upserted)
# ---------------------------------------------------------------------
class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    # Personal
    full_name: Mapped[str | None] = mapped_column(String(160))
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    marital_status: Mapped[str] = mapped_column(String(16), default="single", nullable=False)
    occupation: Mapped[str | None] = mapped_column(String(80))

    # Family
    family_size: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    dependents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Finance
    monthly_income: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    monthly_budget: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    budget_period: Mapped[str] = mapped_column(String(16), default="monthly", nullable=False)

    # Location
    city_tier: Mapped[int] = mapped_column(Integer, default=2, nullable=False)

    # Lifestyle
    smoker: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    alcohol: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    active_lifestyle: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    lifestyle: Mapped[str] = mapped_column(String(16), default="average", nullable=False)

    # Medical
    pre_existing: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    family_history: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    current_insurance: Mapped[str] = mapped_column(String(16), default="none", nullable=False)

    # Insurance needs
    coverage_need: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    needed_benefits: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    preferred_policy_type: Mapped[str] = mapped_column(String(32), default="any", nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="profile")


# ---------------------------------------------------------------------
# Insurance companies + policies
# ---------------------------------------------------------------------
class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    claim_settlement_ratio: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    customer_rating: Mapped[float] = mapped_column(Numeric(3, 1), default=4.0, nullable=False)
    network_hospitals: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    support_availability: Mapped[str] = mapped_column(String(120), default="24x7 helpline", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    policies: Mapped[list["Policy"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    policy_type: Mapped[str] = mapped_column(String(32), default="family_floater", nullable=False)
    premium_monthly: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    coverage_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    min_age: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_age: Mapped[int] = mapped_column(Integer, default=99, nullable=False)
    max_family_size: Mapped[int] = mapped_column(Integer, default=6, nullable=False)
    waiting_period_months: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    benefits: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    exclusions: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    ideal_age_band_min: Mapped[int] = mapped_column(Integer, default=18, nullable=False)
    ideal_age_band_max: Mapped[int] = mapped_column(Integer, default=65, nullable=False)
    claim_settlement_ratio: Mapped[float | None] = mapped_column(Numeric(5, 2))
    network_hospitals: Mapped[int | None] = mapped_column(Integer)
    room_rent_limit: Mapped[str] = mapped_column(String(120), default="Single private AC room", nullable=False)
    co_payment_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    maternity_cover: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pre_existing_coverage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pre_existing_waiting_months: Mapped[int] = mapped_column(Integer, default=36, nullable=False)
    key_benefits_text: Mapped[str] = mapped_column(Text, default="", nullable=False)
    policy_score: Mapped[float] = mapped_column(Numeric(5, 2), default=75, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="policies")


# ---------------------------------------------------------------------
# Recommendations + items
# ---------------------------------------------------------------------
class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    profile_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(8), nullable=False)
    risk_score: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["RecommendationItem"]] = relationship(
        back_populates="recommendation", cascade="all, delete-orphan", order_by="RecommendationItem.rank"
    )
    user: Mapped["User"] = relationship(back_populates="recommendations")
    feedback: Mapped["Feedback | None"] = relationship(
        back_populates="recommendation", uselist=False, cascade="all, delete-orphan"
    )


class RecommendationItem(Base):
    __tablename__ = "recommendation_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    policy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policies.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    factor_breakdown: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recommendation: Mapped["Recommendation"] = relationship(back_populates="items")
    policy: Mapped["Policy"] = relationship()


# ---------------------------------------------------------------------
# Feedback (one per recommendation per user)
# ---------------------------------------------------------------------
class Feedback(Base):
    __tablename__ = "feedback"
    __table_args__ = (
        UniqueConstraint("recommendation_id", "user_id", name="uq_feedback_rec_user"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_feedback_rating"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    was_useful: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recommendation: Mapped["Recommendation"] = relationship(back_populates="feedback")
    user: Mapped["User"] = relationship(back_populates="feedback")
