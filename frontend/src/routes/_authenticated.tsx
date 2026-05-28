// Auth gate — redirects to /login if the user is not authenticated.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

function AuthLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Hard navigate so we preserve the intended URL after login.
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?redirect=${redirect}`);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>
    );
  }
  if (!user) return null;
  return <Outlet />;
}
