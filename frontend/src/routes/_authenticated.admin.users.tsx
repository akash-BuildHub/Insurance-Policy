// Admin: list users
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type UserOut } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api<UserOut[]>("/api/admin/users"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data?.length ?? 0} registered users</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Full name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Registered</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2 pr-4 font-medium text-foreground">{u.full_name ?? "—"}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{u.email}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={u.role === "admin" ? "default" : "outline"}>{u.role}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
