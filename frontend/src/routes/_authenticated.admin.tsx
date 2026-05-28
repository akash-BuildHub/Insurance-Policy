// Admin gate — only users with the 'admin' role can access /admin/*
import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Admin only</h1>
        <p className="mt-2 text-muted-foreground">
          Your account does not have admin privileges. Ask the project owner to promote your
          account (see <code>backend/README.md</code>).
        </p>
      </div>
    );
  }

  const tabs = [
    { to: "/admin", label: "Overview", exact: true },
    { to: "/admin/companies", label: "Companies" },
    { to: "/admin/policies", label: "Policies" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/recommendations", label: "Recommendations" },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Admin dashboard</h1>
        <p className="text-muted-foreground">Manage the catalogue and view platform usage.</p>
      </div>
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => {
          const isActive = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
