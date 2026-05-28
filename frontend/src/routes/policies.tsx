import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type PolicyOut } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/policies")({ component: BrowsePolicies });

function BrowsePolicies() {
  const { data, isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => api<PolicyOut[]>("/api/policies", { auth: false }),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold text-foreground">All health insurance policies</h1>
      <p className="mb-8 text-muted-foreground">
        Browse our seeded database of {data?.length ?? "—"} policies.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground">Loading policies…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{p.company.name}</p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Premium</span>
                  <span className="font-semibold">
                    ₹{p.premium_monthly.toLocaleString("en-IN")}/mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="font-semibold">
                    ₹{(p.coverage_amount / 100000).toFixed(1)} L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span>
                    {p.min_age}–{p.max_age}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claim ratio</span>
                  <Badge variant="outline">
                    {p.claim_settlement_ratio ?? p.company.claim_settlement_ratio}%
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <Link to="/policies/$id" params={{ id: p.id }}>
                    View details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
