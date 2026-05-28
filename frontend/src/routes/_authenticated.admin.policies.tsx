// Admin: CRUD for insurance policies
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type CompanyOut, type PolicyOut } from "@/lib/api";
import { policySchema, BENEFIT_OPTIONS, POLICY_TYPE_OPTIONS } from "@/lib/schemas";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/policies")({ component: AdminPolicies });

type PolicyType =
  | "individual"
  | "family_floater"
  | "senior"
  | "critical_illness"
  | "maternity"
  | "chronic";

type PolicyForm = {
  id?: string;
  company_id: string;
  name: string;
  policy_type: PolicyType;
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
};

const EMPTY: PolicyForm = {
  company_id: "",
  name: "",
  policy_type: "family_floater",
  premium_monthly: 1000,
  coverage_amount: 500000,
  min_age: 18,
  max_age: 65,
  max_family_size: 4,
  waiting_period_months: 24,
  benefits: ["cashless"],
  exclusions: ["cosmetic"],
  ideal_age_band_min: 25,
  ideal_age_band_max: 50,
  claim_settlement_ratio: null,
  network_hospitals: null,
  room_rent_limit: "Single private AC room",
  co_payment_percentage: 0,
  maternity_cover: false,
  pre_existing_coverage: false,
  pre_existing_waiting_months: 36,
  key_benefits_text: "",
  policy_score: 80,
};

function AdminPolicies() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PolicyForm | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: pols, isLoading } = useQuery({
    queryKey: ["admin-policies"],
    queryFn: () => api<PolicyOut[]>("/api/policies"),
  });
  const { data: cos } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: () => api<CompanyOut[]>("/api/companies"),
  });

  const onSave = async () => {
    if (!editing) return;
    if (!editing.company_id) {
      toast.error("Pick a company");
      return;
    }
    const parsed = policySchema.safeParse(editing);
    if (!parsed.success) {
      toast.error("Please check the form fields");
      console.error(parsed.error);
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await api(`/api/policies/${editing.id}`, { method: "PUT", body: parsed.data });
      } else {
        await api("/api/policies", { method: "POST", body: parsed.data });
      }
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-policies"] });
      qc.invalidateQueries({ queryKey: ["policies"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this policy?")) return;
    try {
      await api(`/api/policies/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-policies"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleArr = (key: "benefits" | "exclusions", val: string) =>
    setEditing((f) =>
      f
        ? {
            ...f,
            [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
          }
        : f,
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pols?.length ?? 0} policies in catalogue</p>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="mr-1 h-4 w-4" /> Add policy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All policies</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Policy</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Premium</th>
                  <th className="py-2 pr-4">Cover</th>
                  <th className="py-2 pr-4">Age</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pols?.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 pr-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{p.company.name}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline">{p.policy_type}</Badge>
                    </td>
                    <td className="py-2 pr-4">₹{p.premium_monthly.toLocaleString("en-IN")}/mo</td>
                    <td className="py-2 pr-4">₹{(p.coverage_amount / 100000).toFixed(1)} L</td>
                    <td className="py-2 pr-4">
                      {p.min_age}–{p.max_age}
                    </td>
                    <td className="py-2 pr-4">{p.policy_score}</td>
                    <td className="py-2 pr-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            company_id: p.company_id,
                            name: p.name,
                            policy_type: p.policy_type as PolicyType,
                            premium_monthly: p.premium_monthly,
                            coverage_amount: p.coverage_amount,
                            min_age: p.min_age,
                            max_age: p.max_age,
                            max_family_size: p.max_family_size,
                            waiting_period_months: p.waiting_period_months,
                            benefits: p.benefits,
                            exclusions: p.exclusions,
                            ideal_age_band_min: p.ideal_age_band_min,
                            ideal_age_band_max: p.ideal_age_band_max,
                            claim_settlement_ratio: p.claim_settlement_ratio,
                            network_hospitals: p.network_hospitals,
                            room_rent_limit: p.room_rent_limit,
                            co_payment_percentage: p.co_payment_percentage,
                            maternity_cover: p.maternity_cover,
                            pre_existing_coverage: p.pre_existing_coverage,
                            pre_existing_waiting_months: p.pre_existing_waiting_months,
                            key_benefits_text: p.key_benefits_text,
                            policy_score: p.policy_score,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit policy" : "Add policy"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Policy name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Select
                  value={editing.company_id}
                  onValueChange={(v) => setEditing({ ...editing, company_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {cos?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Policy type</Label>
                <Select
                  value={editing.policy_type}
                  onValueChange={(v) => setEditing({ ...editing, policy_type: v as PolicyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Premium / month (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.premium_monthly}
                  onChange={(e) => setEditing({ ...editing, premium_monthly: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Coverage amount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  step={50000}
                  value={editing.coverage_amount}
                  onChange={(e) => setEditing({ ...editing, coverage_amount: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min age</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={editing.min_age}
                  onChange={(e) => setEditing({ ...editing, min_age: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max age</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={editing.max_age}
                  onChange={(e) => setEditing({ ...editing, max_age: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max family size</Label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={editing.max_family_size}
                  onChange={(e) => setEditing({ ...editing, max_family_size: +e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Waiting period (months)</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={editing.waiting_period_months}
                  onChange={(e) =>
                    setEditing({ ...editing, waiting_period_months: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ideal age band min</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={editing.ideal_age_band_min}
                  onChange={(e) =>
                    setEditing({ ...editing, ideal_age_band_min: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ideal age band max</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={editing.ideal_age_band_max}
                  onChange={(e) =>
                    setEditing({ ...editing, ideal_age_band_max: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Claim ratio override (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={editing.claim_settlement_ratio ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      claim_settlement_ratio:
                        e.target.value === "" ? null : +e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Network hospitals override</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.network_hospitals ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      network_hospitals: e.target.value === "" ? null : +e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Room rent limit</Label>
                <Input
                  value={editing.room_rent_limit}
                  onChange={(e) => setEditing({ ...editing, room_rent_limit: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Co-payment (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editing.co_payment_percentage}
                  onChange={(e) =>
                    setEditing({ ...editing, co_payment_percentage: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pre-existing waiting (months)</Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={editing.pre_existing_waiting_months}
                  onChange={(e) =>
                    setEditing({ ...editing, pre_existing_waiting_months: +e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Policy score (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editing.policy_score}
                  onChange={(e) => setEditing({ ...editing, policy_score: +e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label>Maternity cover</Label>
                <Switch
                  checked={editing.maternity_cover}
                  onCheckedChange={(c) => setEditing({ ...editing, maternity_cover: c })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label>Pre-existing covered</Label>
                <Switch
                  checked={editing.pre_existing_coverage}
                  onCheckedChange={(c) => setEditing({ ...editing, pre_existing_coverage: c })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Key benefits description</Label>
                <Textarea
                  rows={2}
                  value={editing.key_benefits_text}
                  onChange={(e) => setEditing({ ...editing, key_benefits_text: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Benefits</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {BENEFIT_OPTIONS.map((b) => (
                    <label
                      key={b}
                      className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"
                    >
                      <Checkbox
                        checked={editing.benefits.includes(b)}
                        onCheckedChange={() => toggleArr("benefits", b)}
                      />
                      {b.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Exclusions (comma separated)</Label>
                <Input
                  value={editing.exclusions.join(", ")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      exclusions: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
