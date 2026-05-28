// Admin dashboard overview: totals, most recommended, risk distribution
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type AdminAnalytics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, Sparkles, MessageSquare } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminOverview });

const RISK_COLORS: Record<string, string> = {
  Low: "#16a34a",
  Medium: "#eab308",
  High: "#dc2626",
};

function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api<AdminAnalytics>("/api/admin/analytics"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading analytics…</p>;
  if (!data) return <p className="text-muted-foreground">No data.</p>;

  const stat = (Icon: React.ComponentType<{ className?: string }>, label: string, value: number) => (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
      </CardContent>
    </Card>
  );

  const riskData = Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stat(Users, "Users", data.totals.users)}
        {stat(Building2, "Companies", data.totals.companies)}
        {stat(FileText, "Policies", data.totals.policies)}
        {stat(Sparkles, "Recommendations", data.totals.recommendations)}
        {stat(MessageSquare, "Feedback", data.totals.feedback)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most recommended policies</CardTitle>
          </CardHeader>
          <CardContent>
            {data.most_recommended.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, data.most_recommended.length * 50)}>
                <BarChart data={data.most_recommended} layout="vertical" margin={{ left: 30, right: 20 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk profile distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {riskData.every((d) => d.value === 0) ? (
              <p className="text-sm text-muted-foreground">No recommendations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {riskData.map((d) => (
                      <Cell key={d.name} fill={RISK_COLORS[d.name] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
