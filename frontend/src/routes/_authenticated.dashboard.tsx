// User dashboard — recommendation history + last profile summary
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type RecommendationSummary, type UserProfileOut } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, User, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { data: recs, isLoading } = useQuery({
    queryKey: ["my-recs"],
    queryFn: () => api<RecommendationSummary[]>("/api/recommendations"),
  });
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<UserProfileOut | null>("/api/profile"),
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your dashboard</h1>
          <p className="text-muted-foreground">Profile, recommendations, and saved reports.</p>
        </div>
        <Button asChild>
          <Link to="/recommend">
            <Sparkles className="mr-1 h-4 w-4" />
            New recommendation
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!profile ? (
              <p className="text-sm text-muted-foreground">
                You haven't filled the questionnaire yet.{" "}
                <Link to="/recommend" className="text-primary underline">
                  Start now
                </Link>
                .
              </p>
            ) : (
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <Item label="Age" value={String(profile.age)} />
                <Item label="Gender" value={profile.gender} />
                <Item label="Family size" value={String(profile.family_size)} />
                <Item label="Dependents" value={String(profile.dependents)} />
                <Item
                  label="Monthly income"
                  value={`₹${Number(profile.monthly_income).toLocaleString("en-IN")}`}
                />
                <Item
                  label="Budget"
                  value={`₹${Number(profile.monthly_budget).toLocaleString("en-IN")} ${profile.budget_period}`}
                />
                <Item
                  label="Coverage need"
                  value={`₹${(Number(profile.coverage_need) / 100000).toFixed(1)} L`}
                />
                <Item label="Pre-existing" value={profile.pre_existing.join(", ") || "None"} />
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Latest risk profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!recs?.length ? (
              <p className="text-sm text-muted-foreground">No recommendations yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Risk level:</span>
                  <Badge
                    variant={
                      recs[0].risk_level === "Low"
                        ? "default"
                        : recs[0].risk_level === "Medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {recs[0].risk_level}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Risk score {Number(recs[0].risk_score).toFixed(1)} (lower = healthier profile).
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link to="/recommendations/$id" params={{ id: recs[0].id }}>
                    View latest recommendation →
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recommendation history</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : !recs?.length ? (
            <p className="text-muted-foreground">
              No recommendations yet.{" "}
              <Link to="/recommend" className="text-primary underline">
                Run your first
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y">
              {recs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{new Date(r.created_at).toLocaleString()}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Risk: <Badge variant="outline">{r.risk_level}</Badge> · score{" "}
                      {Number(r.risk_score).toFixed(1)}
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/recommendations/$id" params={{ id: r.id }}>
                      View →
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </>
  );
}
