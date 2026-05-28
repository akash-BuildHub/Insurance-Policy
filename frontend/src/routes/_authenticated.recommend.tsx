// =====================================================================
// Health questionnaire — collects everything the recommender needs.
// Hits POST /api/recommendations on submit, then navigates to the
// recommendation result page.
// =====================================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type UserProfileOut } from "@/lib/api";
import {
  userProfileSchema,
  PRE_EXISTING_OPTIONS,
  BENEFIT_OPTIONS,
  FAMILY_HISTORY_OPTIONS,
} from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recommend")({ component: RecommendPage });

const benefitLabels: Record<string, string> = {
  cashless: "Cashless treatment",
  daycare: "Daycare procedures",
  maternity: "Maternity cover",
  ambulance: "Ambulance",
  annual_checkup: "Annual checkup",
  home_care: "Home healthcare",
  international: "International cover",
  critical_illness: "Critical illness",
  mental_health: "Mental health",
  diabetes_management: "Diabetes care",
  newborn_cover: "Newborn cover",
};

const conditionLabels: Record<string, string> = {
  diabetes: "Diabetes",
  hypertension: "Hypertension",
  heart_disease: "Heart disease",
  asthma: "Asthma",
  thyroid: "Thyroid",
  cancer_history: "Cancer history",
};

const familyHistoryLabels: Record<string, string> = {
  diabetes: "Diabetes",
  hypertension: "Hypertension",
  heart_disease: "Heart disease",
  cancer: "Cancer",
  stroke: "Stroke",
};

type FormState = {
  full_name: string;
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
  preferred_policy_type:
    | "any"
    | "individual"
    | "family_floater"
    | "senior"
    | "critical_illness"
    | "maternity"
    | "chronic";
};

const DEFAULTS: FormState = {
  full_name: "",
  age: 32,
  gender: "male",
  marital_status: "married",
  occupation: "",
  family_size: 4,
  dependents: 2,
  monthly_income: 50000,
  monthly_budget: 1500,
  budget_period: "monthly",
  city_tier: 1,
  smoker: false,
  alcohol: false,
  active_lifestyle: true,
  lifestyle: "average",
  pre_existing: [],
  family_history: [],
  current_insurance: "none",
  coverage_need: 1000000,
  needed_benefits: ["cashless", "daycare"],
  preferred_policy_type: "any",
};

function RecommendPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);

  // Pre-fill with last saved profile, if any
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<UserProfileOut | null>("/api/profile"),
  });
  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      age: profile.age,
      gender: profile.gender,
      marital_status: profile.marital_status,
      occupation: profile.occupation ?? "",
      family_size: profile.family_size,
      dependents: profile.dependents,
      monthly_income: Number(profile.monthly_income),
      monthly_budget: Number(profile.monthly_budget),
      budget_period: profile.budget_period,
      city_tier: profile.city_tier,
      smoker: profile.smoker,
      alcohol: profile.alcohol,
      active_lifestyle: profile.active_lifestyle,
      lifestyle: profile.lifestyle,
      pre_existing: profile.pre_existing,
      family_history: profile.family_history,
      current_insurance: profile.current_insurance,
      coverage_need: Number(profile.coverage_need),
      needed_benefits: profile.needed_benefits,
      preferred_policy_type: profile.preferred_policy_type as FormState["preferred_policy_type"],
    });
  }, [profile]);

  const toggleArr = (key: "pre_existing" | "needed_benefits" | "family_history", val: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = userProfileSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please check your inputs");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ recommendation_id: string; top_count: number }>(
        "/api/recommendations",
        { method: "POST", body: parsed.data },
      );
      if (res.top_count === 0) {
        toast.warning("No policies matched your criteria. Try increasing your budget or coverage range.");
      } else {
        toast.success(`Found ${res.top_count} matching policies`);
      }
      navigate({ to: "/recommendations/$id", params: { id: res.recommendation_id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate recommendation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Tell us about you</h1>
      <p className="mb-8 text-muted-foreground">
        We'll classify your risk profile, filter eligible policies, and rank the top 3 by suitability.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Personal ----------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min={0} max={120} value={form.age}
                onChange={(e) => setForm({ ...form, age: +e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v as FormState["gender"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marital status</Label>
              <Select value={form.marital_status}
                onValueChange={(v) =>
                  setForm({ ...form, marital_status: v as FormState["marital_status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occ">Occupation</Label>
              <Input id="occ" value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                placeholder="e.g. software engineer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fam">Family members to cover</Label>
              <Input id="fam" type="number" min={1} max={15} value={form.family_size}
                onChange={(e) => setForm({ ...form, family_size: +e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep">Dependents (kids / parents)</Label>
              <Input id="dep" type="number" min={0} max={15} value={form.dependents}
                onChange={(e) => setForm({ ...form, dependents: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>City tier</Label>
              <Select value={String(form.city_tier)}
                onValueChange={(v) => setForm({ ...form, city_tier: +v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tier 1 (metro)</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3 / rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Health & lifestyle ----------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Health & lifestyle</CardTitle>
            <CardDescription>Used to calculate your Low / Medium / High risk level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="smoker">Smoker</Label>
                <Switch id="smoker" checked={form.smoker}
                  onCheckedChange={(c) => setForm({ ...form, smoker: c })} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="alcohol">Drinks regularly</Label>
                <Switch id="alcohol" checked={form.alcohol}
                  onCheckedChange={(c) => setForm({ ...form, alcohol: c })} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="active">Exercises weekly</Label>
                <Switch id="active" checked={form.active_lifestyle}
                  onCheckedChange={(c) => setForm({ ...form, active_lifestyle: c })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Lifestyle</Label>
              <Select value={form.lifestyle}
                onValueChange={(v) => setForm({ ...form, lifestyle: v as FormState["lifestyle"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (desk job, no exercise)</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="active">Active (regular workouts)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Pre-existing conditions</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {PRE_EXISTING_OPTIONS.map((c) => (
                  <label key={c}
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <Checkbox checked={form.pre_existing.includes(c)}
                      onCheckedChange={() => toggleArr("pre_existing", c)} />
                    {conditionLabels[c] ?? c}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Family medical history</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {FAMILY_HISTORY_OPTIONS.map((c) => (
                  <label key={c}
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <Checkbox checked={form.family_history.includes(c)}
                      onCheckedChange={() => toggleArr("family_history", c)} />
                    {familyHistoryLabels[c] ?? c}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insurance needs -------------------------------------- */}
        <Card>
          <CardHeader><CardTitle>Insurance needs</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="income">Monthly income (₹)</Label>
              <Input id="income" type="number" min={0} value={form.monthly_income}
                onChange={(e) => setForm({ ...form, monthly_income: +e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget">
                Budget ({form.budget_period === "monthly" ? "per month" : "per year"}) (₹)
              </Label>
              <Input id="budget" type="number" min={100} value={form.monthly_budget}
                onChange={(e) => setForm({ ...form, monthly_budget: +e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Budget period</Label>
              <Select value={form.budget_period}
                onValueChange={(v) =>
                  setForm({ ...form, budget_period: v as FormState["budget_period"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Per month</SelectItem>
                  <SelectItem value="yearly">Per year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currently insured?</Label>
              <Select value={form.current_insurance}
                onValueChange={(v) =>
                  setForm({ ...form, current_insurance: v as FormState["current_insurance"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No insurance</SelectItem>
                  <SelectItem value="individual">Individual plan</SelectItem>
                  <SelectItem value="family">Family plan</SelectItem>
                  <SelectItem value="employer">Employer-provided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cov">Coverage needed (₹)</Label>
              <Input id="cov" type="number" min={50000} step={50000} value={form.coverage_need}
                onChange={(e) => setForm({ ...form, coverage_need: +e.target.value })} required />
              <p className="text-xs text-muted-foreground">
                e.g. 500000 = ₹5 lakh, 1000000 = ₹10 lakh
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred policy type</Label>
              <Select value={form.preferred_policy_type}
                onValueChange={(v) =>
                  setForm({ ...form, preferred_policy_type: v as FormState["preferred_policy_type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any (let AI decide)</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="family_floater">Family floater</SelectItem>
                  <SelectItem value="senior">Senior citizen</SelectItem>
                  <SelectItem value="critical_illness">Critical illness</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                  <SelectItem value="chronic">Chronic / diabetes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-2 block">Benefits you care about</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {BENEFIT_OPTIONS.map((b) => (
                  <label key={b}
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                    <Checkbox checked={form.needed_benefits.includes(b)}
                      onCheckedChange={() => toggleArr("needed_benefits", b)} />
                    {benefitLabels[b] ?? b}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Analysing…" : "Get my recommendation"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          AI Insurance Policy is an academic prototype — not licensed financial or insurance advice.
        </p>
      </form>
    </div>
  );
}
