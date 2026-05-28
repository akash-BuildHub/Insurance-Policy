// Recommendation result page — top 3 cards, side-by-side comparison,
// feedback widget, and a downloadable PDF report.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  api,
  type FeedbackOut,
  type RecommendationItemOut,
  type RecommendationOut,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, Check, ArrowRight, Star, AlertCircle } from "lucide-react";
import { generatePdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recommendations/$id")({
  component: ResultPage,
});

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;
const lakh = (n: number) => `₹${(Number(n) / 100000).toFixed(1)} L`;

function ResultPage() {
  const { id } = Route.useParams();
  const { data: rec, isLoading } = useQuery({
    queryKey: ["recommendation", id],
    queryFn: () => api<RecommendationOut>(`/api/recommendations/${id}`),
  });
  const { data: feedback } = useQuery({
    queryKey: ["recommendation-feedback", id],
    queryFn: () => api<FeedbackOut | null>(`/api/feedback/${id}`),
  });

  if (isLoading)
    return <div className="container mx-auto px-4 py-16 text-muted-foreground">Loading…</div>;
  if (!rec)
    return <div className="container mx-auto px-4 py-16">Recommendation not found.</div>;

  const items = rec.items;
  const riskColor =
    rec.risk_level === "Low" ? "default" : rec.risk_level === "Medium" ? "secondary" : "destructive";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* Disclaimer banner */}
      <div className="mb-6 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Academic prototype.</strong> Policy data is illustrative. AI Insurance Policy does not
          provide licensed financial or insurance advice — please verify policy terms with the
          insurer before purchase.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Your top {items.length} {items.length === 1 ? "match" : "matches"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Risk profile:</span>
            <Badge variant={riskColor as "default" | "secondary" | "destructive"}>
              {rec.risk_level}
            </Badge>
            <span>· score {Number(rec.risk_score).toFixed(1)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => generatePdf(rec, items)}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button asChild>
            <Link to="/recommend">New recommendation</Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              No policies matched your filters. Try increasing your budget, lowering coverage need,
              or removing some required benefits.
            </p>
            <Button asChild>
              <Link to="/recommend">Adjust profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((it) => {
              const p = it.policy;
              return (
                <Card
                  key={it.id}
                  className={it.rank === 1 ? "border-primary ring-2 ring-primary/20" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant={it.rank === 1 ? "default" : "outline"}>
                        #{it.rank}
                        {it.rank === 1 && " · best fit"}
                      </Badge>
                      <span className="text-2xl font-bold text-primary">
                        {Math.round(Number(it.score) * 100)}%
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-lg">{p.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{p.company.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={Number(it.score) * 100} />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Premium</div>
                        <div className="font-semibold">{inr(p.premium_monthly)}/mo</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Coverage</div>
                        <div className="font-semibold">{lakh(p.coverage_amount)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Waiting</div>
                        <div className="font-semibold">{p.waiting_period_months} mo</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Claim ratio</div>
                        <div className="font-semibold">
                          {(p.claim_settlement_ratio ?? p.company.claim_settlement_ratio) ?? "—"}%
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                        Why this fits
                      </div>
                      <p className="text-sm text-foreground">{it.reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.benefits.slice(0, 6).map((b) => (
                        <Badge key={b} variant="outline" className="text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          {b.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/policies/$id" params={{ id: p.id }}>
                        View policy details <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {items.length > 1 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Side-by-side comparison</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Feature</th>
                      {items.map((it) => (
                        <th
                          key={it.id}
                          className="py-2 pr-4 font-semibold text-foreground"
                        >
                          #{it.rank} {it.policy.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Premium / month", (it) => inr(it.policy.premium_monthly)],
                        ["Coverage", (it) => lakh(it.policy.coverage_amount)],
                        ["Waiting period", (it) => `${it.policy.waiting_period_months} months`],
                        ["Claim ratio", (it) =>
                          `${(it.policy.claim_settlement_ratio ?? it.policy.company.claim_settlement_ratio) ?? "—"}%`],
                        ["Network hospitals", (it) =>
                          ((it.policy.network_hospitals ?? it.policy.company.network_hospitals) ?? 0)
                            .toLocaleString("en-IN")],
                        ["Room rent", (it) => it.policy.room_rent_limit],
                        ["Co-payment", (it) => `${it.policy.co_payment_percentage}%`],
                        ["Maternity cover", (it) => (it.policy.maternity_cover ? "Yes" : "No")],
                        ["Pre-existing covered", (it) =>
                          it.policy.pre_existing_coverage
                            ? `Yes (after ${it.policy.pre_existing_waiting_months} mo)`
                            : "No"],
                        ["Benefits", (it) => it.policy.benefits.map((b) => b.replace(/_/g, " ")).join(", ")],
                        ["Exclusions", (it) =>
                          it.policy.exclusions.map((b) => b.replace(/_/g, " ")).join(", ") || "—"],
                        ["Match score", (it) => `${Math.round(Number(it.score) * 100)}%`],
                      ] as [string, (it: RecommendationItemOut) => string][]
                    ).map(([label, getter]) => (
                      <tr key={label} className="border-b align-top">
                        <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                        {items.map((it) => (
                          <td key={it.id} className="py-2 pr-4 font-medium text-foreground">
                            {getter(it)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <FeedbackBox recommendationId={rec.id} initial={feedback ?? null} />
    </div>
  );
}

function FeedbackBox({
  recommendationId,
  initial,
}: {
  recommendationId: string;
  initial: FeedbackOut | null;
}) {
  const qc = useQueryClient();
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [useful, setUseful] = useState<boolean>(initial?.was_useful ?? true);
  const [comment, setComment] = useState<string>(initial?.comment ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setRating(initial.rating);
      setUseful(initial.was_useful);
      setComment(initial.comment ?? "");
    }
  }, [initial]);

  const onSubmit = async () => {
    if (rating < 1) {
      toast.error("Please pick a rating");
      return;
    }
    setSaving(true);
    try {
      await api<FeedbackOut>("/api/feedback", {
        method: "POST",
        body: {
          recommendation_id: recommendationId,
          rating,
          was_useful: useful,
          comment: comment || null,
        },
      });
      toast.success("Thanks for your feedback!");
      qc.invalidateQueries({ queryKey: ["recommendation-feedback", recommendationId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit feedback");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>How useful was this recommendation?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
              className="p-1"
            >
              <Star
                className={`h-7 w-7 ${
                  n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-sm text-muted-foreground">{rating} / 5</span>}
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <Label htmlFor="useful">Was this recommendation useful?</Label>
          <Switch id="useful" checked={useful} onCheckedChange={setUseful} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comment">Comments (optional)</Label>
          <Textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked, what didn't, what would have helped…"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving…" : initial ? "Update feedback" : "Submit feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
