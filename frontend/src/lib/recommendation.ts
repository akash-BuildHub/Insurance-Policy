// =====================================================================
// AI Insurance Policy — recommendation engine
//
// Hybrid approach:
//   1. Rule-based eligibility filtering   (age, family size, coverage,
//                                          budget, pre-existing exclusions)
//   2. Risk classification               (Low / Medium / High)
//   3. Content-based scoring             (compares user profile vector
//                                          with policy feature vector)
//   4. Weighted ranking with the spec'd weights:
//        Budget match        30%
//        Coverage match      25%
//        Claim settlement /
//        company reliability 20%
//        Benefits match      15%
//        Risk suitability    10%
//
// This module is pure (no DB / no I/O) so it can be unit-tested and
// reused on both server and client.
// =====================================================================

export interface UserInput {
  full_name?: string;
  age: number;
  gender: string;
  marital_status?: string;
  occupation?: string;
  family_size: number;
  dependents?: number;
  monthly_income: number;
  monthly_budget: number;
  budget_period?: "monthly" | "yearly";
  city_tier: number;
  smoker: boolean;
  alcohol?: boolean;
  active_lifestyle: boolean;
  lifestyle?: "sedentary" | "average" | "active";
  pre_existing: string[];
  family_history?: string[];
  current_insurance?: string;
  coverage_need: number;
  needed_benefits: string[];
  preferred_policy_type?: string;
}

export interface PolicyRow {
  id: string;
  company_id: string;
  name: string;
  policy_type: string;
  premium_monthly: number;
  coverage_amount: number;
  min_age: number;
  max_age: number;
  max_family_size: number;
  waiting_period_months: number;
  benefits: string[];
  exclusions: string[];
  ideal_age_band_min: number;
  ideal_age_band_max: number;
  claim_settlement_ratio?: number | null;
  network_hospitals?: number | null;
  room_rent_limit?: string;
  co_payment_percentage?: number;
  maternity_cover?: boolean;
  pre_existing_coverage?: boolean;
  pre_existing_waiting_months?: number;
  key_benefits_text?: string;
  policy_score?: number;
  company?: {
    name: string;
    claim_settlement_ratio: number;
    network_hospitals: number;
    customer_rating: number;
  };
}

export interface ScoredPolicy {
  policy: PolicyRow;
  score: number;
  rank: number;
  reason: string;
  factors: Record<string, number>;
}

// Spec weights (must sum to 1.0)
export const WEIGHTS = {
  budget: 0.30,
  coverage: 0.25,
  reliability: 0.20,
  benefits: 0.15,
  risk: 0.10,
} as const;

const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

// ---------------------------------------------------------------------
// Monthly-equivalent budget
// ---------------------------------------------------------------------
export function monthlyBudget(user: UserInput): number {
  return user.budget_period === "yearly" ? user.monthly_budget / 12 : user.monthly_budget;
}

// ---------------------------------------------------------------------
// Risk classification (Low / Medium / High)
// Factors: age, pre-existing diseases, smoking, alcohol, lifestyle,
//          family history, occupation, coverage need, current insurance
// ---------------------------------------------------------------------
export function calculateRisk(input: UserInput): {
  level: "Low" | "Medium" | "High";
  score: number;
  factors: Record<string, number>;
} {
  let score = 0;
  const f: Record<string, number> = {};

  // Age
  if (input.age < 30) f.age = 1;
  else if (input.age < 45) f.age = 2;
  else if (input.age < 60) f.age = 4;
  else f.age = 6;
  score += f.age;

  // Pre-existing conditions
  f.pre_existing = input.pre_existing.length * 1.5;
  score += f.pre_existing;

  // Lifestyle: smoking + alcohol + activity
  f.smoking = input.smoker ? 2 : 0;
  f.alcohol = input.alcohol ? 1 : 0;
  if (input.lifestyle === "sedentary") f.activity = 1;
  else if (input.lifestyle === "active") f.activity = -1;
  else f.activity = 0;
  if (input.active_lifestyle) f.activity = Math.min(f.activity, -1);
  score += f.smoking + f.alcohol + f.activity;

  // Family medical history
  f.family_history = (input.family_history?.length ?? 0) * 0.75;
  score += f.family_history;

  // Occupation — flag known high-risk jobs (very basic)
  const hazardous = ["construction", "driver", "miner", "police", "soldier", "firefighter", "factory"];
  const occ = (input.occupation || "").toLowerCase();
  f.occupation = hazardous.some((o) => occ.includes(o)) ? 1 : 0;
  score += f.occupation;

  // Coverage need vs income (high cover ask with low income raises risk)
  const annualIncome = Math.max(input.monthly_income * 12, 1);
  const coverageRatio = input.coverage_need / annualIncome;
  if (coverageRatio > 5) f.coverage_need = 1;
  else if (coverageRatio > 2) f.coverage_need = 0.5;
  else f.coverage_need = 0;
  score += f.coverage_need;

  score = Math.max(0, score);
  const level: "Low" | "Medium" | "High" =
    score <= 3 ? "Low" : score <= 6 ? "Medium" : "High";

  return { level, score: Math.round(score * 10) / 10, factors: f };
}

// ---------------------------------------------------------------------
// Rule-based eligibility filter
// ---------------------------------------------------------------------
export function filterEligible(user: UserInput, policies: PolicyRow[]): PolicyRow[] {
  const budget = monthlyBudget(user);
  return policies.filter((p) => {
    // Age band
    if (user.age < p.min_age || user.age > p.max_age) return false;
    // Family size
    if (user.family_size > p.max_family_size) return false;
    // Coverage need: policy must reach at least 80% of the target.
    if (p.coverage_amount < user.coverage_need * 0.8) return false;
    // Budget: allow up to 15% above stated budget.
    if (p.premium_monthly > budget * 1.15) return false;
    // Pre-existing exclusions
    for (const cond of user.pre_existing) {
      if (p.exclusions.includes(cond)) return false;
    }
    // Preferred policy type (if user picked something specific)
    if (
      user.preferred_policy_type &&
      user.preferred_policy_type !== "any" &&
      p.policy_type !== user.preferred_policy_type
    ) {
      return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------
// Score & rank — content-based + weighted ranking
// ---------------------------------------------------------------------
export function scorePolicies(user: UserInput, policies: PolicyRow[], risk: "Low" | "Medium" | "High"): ScoredPolicy[] {
  if (policies.length === 0) return [];
  const budget = monthlyBudget(user);

  return policies
    .map((p) => {
      // ---- 1) Budget match ---------------------------------------
      // 1.0 when premium is exactly at budget, falls off symmetrically.
      const budgetDelta = Math.abs(p.premium_monthly - budget) / Math.max(budget, 1);
      const budgetScore = clamp(1 - budgetDelta);

      // ---- 2) Coverage match -------------------------------------
      // Peak at the target; surplus above counts (capped); below penalised.
      const coverageRatio = p.coverage_amount / Math.max(user.coverage_need, 1);
      const coverageScore =
        coverageRatio >= 1 ? clamp(1 - (coverageRatio - 1) * 0.15) : clamp(coverageRatio);

      // ---- 3) Company reliability (claim ratio + network) --------
      const claimRatio = p.claim_settlement_ratio ?? p.company?.claim_settlement_ratio ?? 85;
      const claimScore = clamp((claimRatio - 80) / 20); // 80% → 0, 100% → 1
      const network = p.network_hospitals ?? p.company?.network_hospitals ?? 0;
      const networkScore = clamp(network / 10000); // 10k+ → 1
      const rating = p.company?.customer_rating ?? 4;
      const ratingScore = clamp((rating - 3) / 2); // 3★ → 0, 5★ → 1
      const reliabilityScore = claimScore * 0.6 + networkScore * 0.25 + ratingScore * 0.15;

      // ---- 4) Benefits match -------------------------------------
      const needed = user.needed_benefits.length;
      const overlap = needed === 0 ? 0 : user.needed_benefits.filter((b) => p.benefits.includes(b)).length;
      const benefitsScore = needed === 0 ? 0.7 : overlap / needed;

      // ---- 5) Risk suitability -----------------------------------
      // Match policy to user's risk level.
      //   - High risk users score better on policies with PED coverage,
      //     critical-illness / chronic / senior types, and low waiting.
      //   - Low risk users score better on individual / young-adult plans.
      let riskScore = 0.5;
      const inBand =
        user.age >= p.ideal_age_band_min && user.age <= p.ideal_age_band_max ? 1 : 0;
      if (risk === "High") {
        riskScore =
          (p.pre_existing_coverage ? 0.4 : 0) +
          (p.policy_type === "critical_illness" || p.policy_type === "chronic" || p.policy_type === "senior" ? 0.3 : 0.15) +
          clamp(1 - (p.waiting_period_months ?? 24) / 36) * 0.2 +
          inBand * 0.1;
      } else if (risk === "Medium") {
        riskScore =
          (p.pre_existing_coverage ? 0.25 : 0.1) +
          (p.policy_type === "family_floater" || p.policy_type === "individual" ? 0.3 : 0.2) +
          clamp(1 - (p.waiting_period_months ?? 24) / 36) * 0.2 +
          inBand * 0.25;
      } else {
        riskScore =
          (p.policy_type === "individual" || p.policy_type === "family_floater" ? 0.4 : 0.2) +
          clamp(1 - (p.waiting_period_months ?? 24) / 24) * 0.25 +
          inBand * 0.35;
      }
      riskScore = clamp(riskScore);

      // ---- Weighted total ----------------------------------------
      const factors = {
        budget: budgetScore,
        coverage: coverageScore,
        reliability: reliabilityScore,
        benefits: benefitsScore,
        risk: riskScore,
      };

      const score =
        WEIGHTS.budget * budgetScore +
        WEIGHTS.coverage * coverageScore +
        WEIGHTS.reliability * reliabilityScore +
        WEIGHTS.benefits * benefitsScore +
        WEIGHTS.risk * riskScore;

      return { policy: p, score, rank: 0, reason: "", factors };
    })
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1, reason: buildReason(user, s) }));
}

function buildReason(user: UserInput, s: ScoredPolicy): string {
  const p = s.policy;
  const parts: string[] = [];
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const lakhs = (n: number) => `₹${(n / 100000).toFixed(1)} lakh`;
  const budget = monthlyBudget(user);
  const claim = p.claim_settlement_ratio ?? p.company?.claim_settlement_ratio ?? 0;
  const net = p.network_hospitals ?? p.company?.network_hospitals ?? 0;

  if (s.factors.budget > 0.75)
    parts.push(`monthly premium of ${inr(p.premium_monthly)} fits well within your ${inr(budget)} budget`);
  else if (s.factors.budget > 0.45)
    parts.push(`premium ${inr(p.premium_monthly)} is close to your ${inr(budget)} budget`);

  if (s.factors.coverage >= 0.95)
    parts.push(`provides ${lakhs(p.coverage_amount)} coverage, matching your ${lakhs(user.coverage_need)} target`);
  else if (s.factors.coverage >= 0.8)
    parts.push(`covers ${lakhs(p.coverage_amount)} — slightly below your ${lakhs(user.coverage_need)} target`);

  if (p.company && claim >= 95)
    parts.push(`${p.company.name} has a strong ${claim}% claim settlement ratio`);
  else if (p.company && claim >= 90)
    parts.push(`${p.company.name} settles ${claim}% of claims`);

  if (net >= 7000) parts.push(`cashless across ${net.toLocaleString("en-IN")}+ hospitals`);

  if (user.needed_benefits.length > 0 && s.factors.benefits >= 0.7) {
    const matched = user.needed_benefits.filter((b) => p.benefits.includes(b));
    if (matched.length > 0) parts.push(`includes the benefits you asked for (${matched.join(", ").replace(/_/g, " ")})`);
  }

  if (p.pre_existing_coverage && user.pre_existing.length > 0)
    parts.push(`covers your pre-existing conditions after ${p.pre_existing_waiting_months ?? 36} months`);

  if (parts.length === 0)
    parts.push(`overall suitability score ${Math.round(s.score * 100)}% across budget, coverage and benefits`);

  return parts.join("; ") + ".";
}

// ---------------------------------------------------------------------
// Top-level entry point
// ---------------------------------------------------------------------
export function runRecommendation(user: UserInput, policies: PolicyRow[]) {
  const risk = calculateRisk(user);
  const eligible = filterEligible(user, policies);
  const scored = scorePolicies(user, eligible, risk.level);
  return {
    scored,
    risk: { level: risk.level, score: risk.score },
    riskFactors: risk.factors,
    eligibleCount: eligible.length,
    totalCount: policies.length,
  };
}

// Convenience re-export for old call sites that used calculateRiskLevel
export const calculateRiskLevel = (u: UserInput) => {
  const r = calculateRisk(u);
  return { level: r.level, score: r.score };
};
