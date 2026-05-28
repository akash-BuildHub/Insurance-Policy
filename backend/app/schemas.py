"""Pydantic schemas — API request / response shapes."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ---------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=160)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    role: Literal["user", "admin"]
    created_at: datetime


TokenResponse.model_rebuild()


# ---------------------------------------------------------------------
# User profile (health questionnaire)
# ---------------------------------------------------------------------
Gender = Literal["male", "female", "other"]
MaritalStatus = Literal["single", "married", "divorced", "widowed"]
BudgetPeriod = Literal["monthly", "yearly"]
Lifestyle = Literal["sedentary", "average", "active"]
CurrentInsurance = Literal["none", "individual", "family", "employer"]
PolicyType = Literal[
    "individual", "family_floater", "senior", "critical_illness", "maternity", "chronic"
]
PreferredPolicyType = Literal["any", *PolicyType.__args__]  # type: ignore[misc]


class UserProfileIn(BaseModel):
    full_name: str | None = Field(default=None, max_length=160)
    age: int = Field(ge=0, le=120)
    gender: Gender
    marital_status: MaritalStatus = "single"
    occupation: str = Field(default="", max_length=80)
    family_size: int = Field(ge=1, le=15)
    dependents: int = Field(default=0, ge=0, le=15)
    monthly_income: float = Field(ge=0)
    monthly_budget: float = Field(ge=100)
    budget_period: BudgetPeriod = "monthly"
    city_tier: int = Field(ge=1, le=3)
    smoker: bool
    alcohol: bool = False
    active_lifestyle: bool
    lifestyle: Lifestyle = "average"
    pre_existing: list[str] = Field(default_factory=list)
    family_history: list[str] = Field(default_factory=list)
    current_insurance: CurrentInsurance = "none"
    coverage_need: float = Field(ge=50000)
    needed_benefits: list[str] = Field(default_factory=list)
    preferred_policy_type: PreferredPolicyType = "any"


class UserProfileOut(UserProfileIn):
    model_config = ConfigDict(from_attributes=True)
    user_id: uuid.UUID
    updated_at: datetime


# ---------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------
class CompanyBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    claim_settlement_ratio: float = Field(ge=0, le=100)
    customer_rating: float = Field(ge=0, le=5)
    network_hospitals: int = Field(ge=0)
    support_availability: str = Field(default="24x7 helpline", max_length=120)
    description: str = Field(default="", max_length=2000)
    logo_url: str | None = None


class CompanyIn(CompanyBase):
    pass


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime


# ---------------------------------------------------------------------
# Policy
# ---------------------------------------------------------------------
class PolicyBase(BaseModel):
    company_id: uuid.UUID
    name: str = Field(min_length=1, max_length=160)
    policy_type: PolicyType
    premium_monthly: float = Field(ge=0)
    coverage_amount: float = Field(ge=0)
    min_age: int = Field(ge=0, le=120)
    max_age: int = Field(ge=0, le=120)
    max_family_size: int = Field(ge=1, le=15)
    waiting_period_months: int = Field(ge=0, le=120)
    benefits: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    ideal_age_band_min: int = Field(ge=0, le=120)
    ideal_age_band_max: int = Field(ge=0, le=120)
    claim_settlement_ratio: float | None = Field(default=None, ge=0, le=100)
    network_hospitals: int | None = Field(default=None, ge=0)
    room_rent_limit: str = Field(default="Single private AC room", max_length=120)
    co_payment_percentage: float = Field(default=0, ge=0, le=100)
    maternity_cover: bool = False
    pre_existing_coverage: bool = False
    pre_existing_waiting_months: int = Field(default=36, ge=0, le=120)
    key_benefits_text: str = Field(default="", max_length=2000)
    policy_score: float = Field(default=75, ge=0, le=100)


class PolicyIn(PolicyBase):
    pass


class PolicyOut(PolicyBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    company: CompanyOut


# ---------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------
class RecommendationItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    rank: int
    score: float
    reason: str
    factor_breakdown: dict
    policy: PolicyOut


class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    risk_level: str
    risk_score: float
    profile_snapshot: dict
    created_at: datetime
    items: list[RecommendationItemOut] = []


class RecommendationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    risk_level: str
    risk_score: float
    created_at: datetime


class RunRecommendationResponse(BaseModel):
    recommendation_id: uuid.UUID
    top_count: int


# ---------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------
class FeedbackIn(BaseModel):
    recommendation_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    was_useful: bool = True
    comment: str | None = Field(default=None, max_length=2000)


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    recommendation_id: uuid.UUID
    rating: int
    was_useful: bool
    comment: str | None
    created_at: datetime


# ---------------------------------------------------------------------
# Admin analytics
# ---------------------------------------------------------------------
class MostRecommendedItem(BaseModel):
    id: uuid.UUID
    name: str
    company: str
    count: int


class AdminTotals(BaseModel):
    users: int
    companies: int
    policies: int
    recommendations: int
    feedback: int


class AdminAnalytics(BaseModel):
    totals: AdminTotals
    most_recommended: list[MostRecommendedItem]
    risk_distribution: dict[str, int]


class AdminRecommendationRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    risk_level: str
    risk_score: float
    created_at: datetime
