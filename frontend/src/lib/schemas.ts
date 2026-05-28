import { z } from "zod";

// Health questionnaire — captures everything needed for risk + recommendation.
export const userProfileSchema = z.object({
  // Personal
  full_name: z.string().min(1).max(120).optional().default(""),
  age: z.coerce.number().int().min(0).max(120),
  gender: z.enum(["male", "female", "other"]),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).default("single"),
  occupation: z.string().max(80).optional().default(""),

  // Family / dependents
  family_size: z.coerce.number().int().min(1).max(15),
  dependents: z.coerce.number().int().min(0).max(15).default(0),

  // Finance
  monthly_income: z.coerce.number().min(0),
  monthly_budget: z.coerce.number().min(100),
  budget_period: z.enum(["monthly", "yearly"]).default("monthly"),

  // Location
  city_tier: z.coerce.number().int().min(1).max(3),

  // Lifestyle
  smoker: z.boolean(),
  alcohol: z.boolean().default(false),
  active_lifestyle: z.boolean(),
  lifestyle: z.enum(["sedentary", "average", "active"]).default("average"),

  // Medical
  pre_existing: z.array(z.string()).default([]),
  family_history: z.array(z.string()).default([]),
  current_insurance: z.enum(["none", "individual", "family", "employer"]).default("none"),

  // Insurance needs
  coverage_need: z.coerce.number().min(50000),
  needed_benefits: z.array(z.string()).default([]),
  preferred_policy_type: z
    .enum(["any", "individual", "family_floater", "senior", "critical_illness", "maternity", "chronic"])
    .default("any"),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const PRE_EXISTING_OPTIONS = [
  "diabetes",
  "hypertension",
  "heart_disease",
  "asthma",
  "thyroid",
  "cancer_history",
];

export const FAMILY_HISTORY_OPTIONS = [
  "diabetes",
  "hypertension",
  "heart_disease",
  "cancer",
  "stroke",
];

export const BENEFIT_OPTIONS = [
  "cashless",
  "daycare",
  "maternity",
  "ambulance",
  "annual_checkup",
  "home_care",
  "international",
  "critical_illness",
  "mental_health",
  "diabetes_management",
  "newborn_cover",
];

export const POLICY_TYPE_OPTIONS = [
  "individual",
  "family_floater",
  "senior",
  "critical_illness",
  "maternity",
  "chronic",
];

export const companySchema = z.object({
  name: z.string().min(1).max(120),
  claim_settlement_ratio: z.coerce.number().min(0).max(100),
  customer_rating: z.coerce.number().min(0).max(5),
  network_hospitals: z.coerce.number().int().min(0),
  support_availability: z.string().min(1).max(120).default("24x7 helpline"),
  description: z.string().max(500).default(""),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export const policySchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(160),
  policy_type: z.enum([
    "individual",
    "family_floater",
    "senior",
    "critical_illness",
    "maternity",
    "chronic",
  ]),
  premium_monthly: z.coerce.number().min(0),
  coverage_amount: z.coerce.number().min(0),
  min_age: z.coerce.number().int().min(0).max(120),
  max_age: z.coerce.number().int().min(0).max(120),
  max_family_size: z.coerce.number().int().min(1).max(15),
  waiting_period_months: z.coerce.number().int().min(0).max(120),
  benefits: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  ideal_age_band_min: z.coerce.number().int().min(0).max(120),
  ideal_age_band_max: z.coerce.number().int().min(0).max(120),
  claim_settlement_ratio: z.coerce.number().min(0).max(100).optional().nullable(),
  network_hospitals: z.coerce.number().int().min(0).optional().nullable(),
  room_rent_limit: z.string().min(1).max(120).default("Single private AC room"),
  co_payment_percentage: z.coerce.number().min(0).max(100).default(0),
  maternity_cover: z.boolean().default(false),
  pre_existing_coverage: z.boolean().default(false),
  pre_existing_waiting_months: z.coerce.number().int().min(0).max(120).default(36),
  key_benefits_text: z.string().max(500).default(""),
  policy_score: z.coerce.number().min(0).max(100).default(75),
});

// Feedback for a recommendation
export const feedbackSchema = z.object({
  recommendation_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  was_useful: z.boolean().default(true),
  comment: z.string().max(800).optional().default(""),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
