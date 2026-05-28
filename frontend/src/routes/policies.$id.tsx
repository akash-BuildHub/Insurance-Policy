// Public-facing policy detail page
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type PolicyOut } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/policies/$id")({ component: PolicyDetail });

function PolicyDetail() {
  const { id } = Route.useParams();
  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", id],
    queryFn: () => api<PolicyOut>(`/api/policies/${id}`, { auth: false }),
  });

  if (isLoading)
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Loading…</div>;
  if (!policy) return <div className="container mx-auto px-4 py-16">Policy not found.</div>;

  const claim = policy.claim_settlement_ratio ?? policy.company.claim_settlement_ratio;
  const network = policy.network_hospitals ?? policy.company.network_hospitals;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{policy.name}</CardTitle>
              <p className="text-muted-foreground">{policy.company.name}</p>
            </div>
            <Badge variant="outline">{policy.policy_type.replace(/_/g, " ")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {policy.key_benefits_text && (
            <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground">
              {policy.key_benefits_text}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Premium" value={`₹${policy.premium_monthly.toLocaleString("en-IN")}/mo`} />
            <Stat label="Coverage" value={`₹${(policy.coverage_amount / 100000).toFixed(1)} L`} />
            <Stat label="Age range" value={`${policy.min_age}–${policy.max_age}`} />
            <Stat label="Waiting" value={`${policy.waiting_period_months} mo`} />
            <Stat label="Family size" value={`up to ${policy.max_family_size}`} />
            <Stat label="Claim ratio" value={`${claim ?? "—"}%`} />
            <Stat label="Hospitals" value={(network ?? 0).toLocaleString("en-IN")} />
            <Stat label="Rating" value={`${policy.company.customer_rating} ★`} />
            <Stat label="Room rent" value={policy.room_rent_limit} />
            <Stat label="Co-payment" value={`${policy.co_payment_percentage}%`} />
            <Stat label="Maternity" value={policy.maternity_cover ? "Included" : "Not included"} />
            <Stat
              label="Pre-existing"
              value={
                policy.pre_existing_coverage
                  ? `After ${policy.pre_existing_waiting_months} mo`
                  : "Not covered"
              }
            />
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {policy.benefits.map((b) => (
                <Badge key={b} variant="outline">
                  <Check className="mr-1 h-3 w-3 text-green-600" />
                  {b.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
          {policy.exclusions.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Exclusions</h3>
              <div className="flex flex-wrap gap-2">
                {policy.exclusions.map((b) => (
                  <Badge key={b} variant="outline">
                    <X className="mr-1 h-3 w-3 text-red-600" />
                    {b.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {policy.company.description && (
            <div>
              <h3 className="mb-2 font-semibold">About {policy.company.name}</h3>
              <p className="text-sm text-muted-foreground">{policy.company.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Support: {policy.company.support_availability}
              </p>
            </div>
          )}

          <Button asChild className="w-full">
            <Link to="/recommend">See if this fits your profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}
