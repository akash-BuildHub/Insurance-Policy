"""PolicyMate AI — recommendation engine (Python port).

Hybrid pipeline:
  1. Rule-based eligibility filtering
  2. Risk classification (Low / Medium / High)
  3. Content-based scoring
  4. Weighted ranking with spec'd weights:
       Budget match                          30%
       Coverage match                        25%
       Claim settlement / company reliability 20%
       Benefits match                        15%
       Risk suitability                      10%

Pure functions — no DB / no I/O.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

# Weights (sum = 1.0)
WEIGHTS = {
    "budget": 0.30,
    "coverage": 0.25,
    "reliability": 0.20,
    "benefits": 0.15,
    "risk": 0.10,
}

RiskLevel = Literal["Low", "Medium", "High"]
HAZARDOUS_OCCUPATIONS = (
    "construction", "driver", "miner", "police", "soldier", "firefighter", "factory",
)


def _clamp(n: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, n))


def monthly_budget(profile: dict) -> float:
    b = float(profile.get("monthly_budget", 0))
    if profile.get("budget_period") == "yearly":
        return b / 12.0
    return b


@dataclass
class RiskResult:
    level: RiskLevel
    score: float
    factors: dict[str, float] = field(default_factory=dict)


def calculate_risk(profile: dict) -> RiskResult:
    factors: dict[str, float] = {}
    score = 0.0

    age = int(profile.get("age", 0))
    if age < 30:
        factors["age"] = 1
    elif age < 45:
        factors["age"] = 2
    elif age < 60:
        factors["age"] = 4
    else:
        factors["age"] = 6
    score += factors["age"]

    factors["pre_existing"] = len(profile.get("pre_existing") or []) * 1.5
    score += factors["pre_existing"]

    factors["smoking"] = 2 if profile.get("smoker") else 0
    factors["alcohol"] = 1 if profile.get("alcohol") else 0

    lifestyle = profile.get("lifestyle", "average")
    if lifestyle == "sedentary":
        factors["activity"] = 1
    elif lifestyle == "active":
        factors["activity"] = -1
    else:
        factors["activity"] = 0
    if profile.get("active_lifestyle"):
        factors["activity"] = min(factors["activity"], -1)
    score += factors["smoking"] + factors["alcohol"] + factors["activity"]

    factors["family_history"] = len(profile.get("family_history") or []) * 0.75
    score += factors["family_history"]

    occ = (profile.get("occupation") or "").lower()
    factors["occupation"] = 1.0 if any(h in occ for h in HAZARDOUS_OCCUPATIONS) else 0.0
    score += factors["occupation"]

    annual_income = max(float(profile.get("monthly_income", 0)) * 12, 1)
    coverage_ratio = float(profile.get("coverage_need", 0)) / annual_income
    if coverage_ratio > 5:
        factors["coverage_need"] = 1.0
    elif coverage_ratio > 2:
        factors["coverage_need"] = 0.5
    else:
        factors["coverage_need"] = 0.0
    score += factors["coverage_need"]

    score = max(0.0, score)
    level: RiskLevel = "Low" if score <= 3 else ("Medium" if score <= 6 else "High")
    return RiskResult(level=level, score=round(score, 1), factors=factors)


def _policy_features(p: Any) -> dict:
    """Reads policy attributes from an ORM Policy object or a dict."""
    if isinstance(p, dict):
        return p

    def g(name: str, default=None):
        return getattr(p, name, default)

    company = g("company")
    return {
        "id": str(g("id")),
        "company_id": str(g("company_id")),
        "name": g("name"),
        "policy_type": g("policy_type"),
        "premium_monthly": float(g("premium_monthly") or 0),
        "coverage_amount": float(g("coverage_amount") or 0),
        "min_age": int(g("min_age") or 0),
        "max_age": int(g("max_age") or 120),
        "max_family_size": int(g("max_family_size") or 6),
        "waiting_period_months": int(g("waiting_period_months") or 0),
        "benefits": list(g("benefits") or []),
        "exclusions": list(g("exclusions") or []),
        "ideal_age_band_min": int(g("ideal_age_band_min") or 18),
        "ideal_age_band_max": int(g("ideal_age_band_max") or 65),
        "claim_settlement_ratio": float(g("claim_settlement_ratio"))
        if g("claim_settlement_ratio") is not None
        else None,
        "network_hospitals": int(g("network_hospitals"))
        if g("network_hospitals") is not None
        else None,
        "room_rent_limit": g("room_rent_limit"),
        "co_payment_percentage": float(g("co_payment_percentage") or 0),
        "maternity_cover": bool(g("maternity_cover")),
        "pre_existing_coverage": bool(g("pre_existing_coverage")),
        "pre_existing_waiting_months": int(g("pre_existing_waiting_months") or 36),
        "key_benefits_text": g("key_benefits_text"),
        "policy_score": float(g("policy_score") or 75),
        "company": {
            "name": getattr(company, "name", None) if company else None,
            "claim_settlement_ratio": float(getattr(company, "claim_settlement_ratio", 85))
            if company
            else 85.0,
            "network_hospitals": int(getattr(company, "network_hospitals", 0)) if company else 0,
            "customer_rating": float(getattr(company, "customer_rating", 4)) if company else 4.0,
        }
        if company
        else None,
    }


def filter_eligible(profile: dict, policies: list[dict]) -> list[dict]:
    budget = monthly_budget(profile)
    out: list[dict] = []
    for p in policies:
        if profile["age"] < p["min_age"] or profile["age"] > p["max_age"]:
            continue
        if profile["family_size"] > p["max_family_size"]:
            continue
        if p["coverage_amount"] < float(profile["coverage_need"]) * 0.8:
            continue
        if p["premium_monthly"] > budget * 1.15:
            continue
        excl = set(p["exclusions"])
        if any(c in excl for c in profile.get("pre_existing") or []):
            continue
        pref = profile.get("preferred_policy_type") or "any"
        if pref != "any" and p["policy_type"] != pref:
            continue
        out.append(p)
    return out


def _build_reason(profile: dict, score: float, factors: dict, p: dict) -> str:
    parts: list[str] = []
    budget = monthly_budget(profile)
    inr = lambda n: f"Rs. {int(n):,}"
    lakhs = lambda n: f"Rs. {n / 100000:.1f} lakh"
    claim = p.get("claim_settlement_ratio") or (
        p.get("company") or {}
    ).get("claim_settlement_ratio") or 0
    net = p.get("network_hospitals") or (p.get("company") or {}).get("network_hospitals") or 0
    company_name = (p.get("company") or {}).get("name") or ""

    if factors["budget"] > 0.75:
        parts.append(
            f"monthly premium of {inr(p['premium_monthly'])} fits well within your {inr(budget)} budget"
        )
    elif factors["budget"] > 0.45:
        parts.append(f"premium {inr(p['premium_monthly'])} is close to your {inr(budget)} budget")

    if factors["coverage"] >= 0.95:
        parts.append(
            f"provides {lakhs(p['coverage_amount'])} coverage, matching your {lakhs(profile['coverage_need'])} target"
        )
    elif factors["coverage"] >= 0.8:
        parts.append(
            f"covers {lakhs(p['coverage_amount'])} — slightly below your {lakhs(profile['coverage_need'])} target"
        )

    if company_name and claim >= 95:
        parts.append(f"{company_name} has a strong {claim}% claim settlement ratio")
    elif company_name and claim >= 90:
        parts.append(f"{company_name} settles {claim}% of claims")

    if net >= 7000:
        parts.append(f"cashless across {net:,}+ hospitals")

    needed = profile.get("needed_benefits") or []
    if needed and factors["benefits"] >= 0.7:
        matched = [b for b in needed if b in p["benefits"]]
        if matched:
            parts.append(
                "includes the benefits you asked for ("
                + ", ".join(b.replace("_", " ") for b in matched)
                + ")"
            )

    if p["pre_existing_coverage"] and profile.get("pre_existing"):
        parts.append(
            f"covers your pre-existing conditions after {p.get('pre_existing_waiting_months', 36)} months"
        )

    if not parts:
        parts.append(
            f"overall suitability score {round(score * 100)}% across budget, coverage and benefits"
        )
    return "; ".join(parts) + "."


def score_policies(profile: dict, policies: list[dict], risk_level: RiskLevel) -> list[dict]:
    """Returns a sorted list of dicts: {policy, score, factors, rank, reason}."""
    budget = monthly_budget(profile)
    scored: list[dict] = []

    for p in policies:
        # Budget
        delta = abs(p["premium_monthly"] - budget) / max(budget, 1)
        budget_score = _clamp(1 - delta)

        # Coverage
        ratio = p["coverage_amount"] / max(profile["coverage_need"], 1)
        coverage_score = _clamp(1 - (ratio - 1) * 0.15) if ratio >= 1 else _clamp(ratio)

        # Reliability
        claim = p.get("claim_settlement_ratio") or (p.get("company") or {}).get(
            "claim_settlement_ratio", 85
        )
        claim_score = _clamp((float(claim) - 80) / 20)
        net = p.get("network_hospitals") or (p.get("company") or {}).get("network_hospitals", 0)
        net_score = _clamp(float(net) / 10000)
        rating = (p.get("company") or {}).get("customer_rating", 4)
        rating_score = _clamp((float(rating) - 3) / 2)
        reliability_score = claim_score * 0.6 + net_score * 0.25 + rating_score * 0.15

        # Benefits
        needed = profile.get("needed_benefits") or []
        if not needed:
            benefits_score = 0.7
        else:
            overlap = sum(1 for b in needed if b in p["benefits"])
            benefits_score = overlap / len(needed)

        # Risk suitability
        in_band = (
            1.0 if profile["age"] >= p["ideal_age_band_min"] and profile["age"] <= p["ideal_age_band_max"]
            else 0.0
        )
        waiting_score = _clamp(1 - (p["waiting_period_months"] or 0) / 36)
        if risk_level == "High":
            risk_score = (
                (0.4 if p["pre_existing_coverage"] else 0)
                + (0.30 if p["policy_type"] in ("critical_illness", "chronic", "senior") else 0.15)
                + waiting_score * 0.2
                + in_band * 0.1
            )
        elif risk_level == "Medium":
            risk_score = (
                (0.25 if p["pre_existing_coverage"] else 0.10)
                + (0.30 if p["policy_type"] in ("family_floater", "individual") else 0.20)
                + waiting_score * 0.2
                + in_band * 0.25
            )
        else:  # Low
            risk_score = (
                (0.40 if p["policy_type"] in ("individual", "family_floater") else 0.20)
                + _clamp(1 - (p["waiting_period_months"] or 0) / 24) * 0.25
                + in_band * 0.35
            )
        risk_score = _clamp(risk_score)

        factors = {
            "budget": round(budget_score, 4),
            "coverage": round(coverage_score, 4),
            "reliability": round(reliability_score, 4),
            "benefits": round(benefits_score, 4),
            "risk": round(risk_score, 4),
        }
        total = (
            WEIGHTS["budget"] * budget_score
            + WEIGHTS["coverage"] * coverage_score
            + WEIGHTS["reliability"] * reliability_score
            + WEIGHTS["benefits"] * benefits_score
            + WEIGHTS["risk"] * risk_score
        )

        scored.append({"policy": p, "score": round(total, 6), "factors": factors})

    scored.sort(key=lambda s: s["score"], reverse=True)
    for i, s in enumerate(scored):
        s["rank"] = i + 1
        s["reason"] = _build_reason(profile, s["score"], s["factors"], s["policy"])
    return scored


def run_recommendation(profile: dict, policies_orm: list[Any]) -> dict:
    """Top-level entry — accepts a profile dict and a list of ORM Policy rows."""
    policies = [_policy_features(p) for p in policies_orm]
    risk = calculate_risk(profile)
    eligible = filter_eligible(profile, policies)
    scored = score_policies(profile, eligible, risk.level)
    return {
        "scored": scored,
        "risk": {"level": risk.level, "score": risk.score},
        "risk_factors": risk.factors,
        "eligible_count": len(eligible),
        "total_count": len(policies),
    }
