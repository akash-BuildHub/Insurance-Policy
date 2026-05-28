// Admin: list recent recommendations
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type AdminRecommendationRow } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/recommendations")({
  component: AdminRecs,
});

function AdminRecs() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-recs"],
    queryFn: () => api<AdminRecommendationRow[]>("/api/admin/recommendations"),
  });

  const variantFor = (level: string) =>
    level === "Low" ? "default" : level === "Medium" ? "secondary" : "destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data?.length ?? 0} recent recommendations</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">When</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Risk</th>
                <th className="py-2 pr-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                    {r.user_id.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant={
                        variantFor(r.risk_level) as "default" | "secondary" | "destructive"
                      }
                    >
                      {r.risk_level}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4">{Number(r.risk_score).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
