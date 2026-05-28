// =====================================================================
// AI Insurance Policy — REST API client
//
// Tiny fetch wrapper that:
//   * prepends VITE_API_URL
//   * attaches the JWT from localStorage as Authorization: Bearer
//   * throws an Error with the server's `detail` field on non-2xx
// =====================================================================

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";
const TOKEN_KEY = "ai-insurance-policy.token";

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (token === null) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean; // include bearer token (default true)
};

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "detail" in data
        ? (Array.isArray((data as { detail: unknown }).detail)
            ? JSON.stringify((data as { detail: unknown }).detail)
            : String((data as { detail: unknown }).detail))
        : `Request failed: ${res.status}`);
    throw new Error(message);
  }
  return data as T;
}

// ------------------- Typed helpers -------------------
export interface UserOut {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  user: UserOut;
}

export interface CompanyOut {
  id: string;
  name: string;
  claim_settlement_ratio: number;
  customer_rating: number;
  network_hospitals: number;
  support_availability: string;
  description: string;
  logo_url: string | null;
  created_at: string;
}

export interface PolicyOut {
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
  claim_settlement_ratio: number | null;
  network_hospitals: number | null;
  room_rent_limit: string;
  co_payment_percentage: number;
  maternity_cover: boolean;
  pre_existing_coverage: boolean;
  pre_existing_waiting_months: number;
  key_benefits_text: string;
  policy_score: number;
  created_at: string;
  company: CompanyOut;
}

export interface RecommendationItemOut {
  id: string;
  rank: number;
  score: number;
  reason: string;
  factor_breakdown: Record<string, number>;
  policy: PolicyOut;
}

export interface RecommendationOut {
  id: string;
  user_id: string;
  risk_level: string;
  risk_score: number;
  profile_snapshot: Record<string, unknown>;
  created_at: string;
  items: RecommendationItemOut[];
}

export interface RecommendationSummary {
  id: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
}

export interface FeedbackOut {
  id: string;
  recommendation_id: string;
  rating: number;
  was_useful: boolean;
  comment: string | null;
  created_at: string;
}

export interface UserProfileOut {
  user_id: string;
  full_name: string | null;
  age: number;
  gender: "male" | "female" | "other";
  marital_status: "single" | "married" | "divorced" | "widowed";
  occupation: string;
  family_size: number;
  dependents: number;
  monthly_income: number;
  monthly_budget: number;
  budget_period: "monthly" | "yearly";
  city_tier: number;
  smoker: boolean;
  alcohol: boolean;
  active_lifestyle: boolean;
  lifestyle: "sedentary" | "average" | "active";
  pre_existing: string[];
  family_history: string[];
  current_insurance: "none" | "individual" | "family" | "employer";
  coverage_need: number;
  needed_benefits: string[];
  preferred_policy_type: string;
  updated_at: string;
}

export interface AdminAnalytics {
  totals: {
    users: number;
    companies: number;
    policies: number;
    recommendations: number;
    feedback: number;
  };
  most_recommended: { id: string; name: string; company: string; count: number }[];
  risk_distribution: Record<string, number>;
}

export interface AdminRecommendationRow {
  id: string;
  user_id: string;
  risk_level: string;
  risk_score: number;
  created_at: string;
}
