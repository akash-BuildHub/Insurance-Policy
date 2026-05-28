import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const signOut = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Shield className="h-5 w-5 text-primary" />
          <span>AI Insurance Policy</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link to="/policies" className="text-muted-foreground hover:text-foreground">
            Browse policies
          </Link>
          <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground">
            How it works
          </Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          {user && (
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Button asChild size="sm">
                <Link to="/recommend">Get recommendation</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30 py-8 text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 md:flex-row">
        <p>
          © {new Date().getFullYear()} AI Insurance Policy — academic demo, not a licensed insurance
          advisor.
        </p>
        <Link to="/disclaimer" className="hover:text-foreground">
          Disclaimer
        </Link>
      </div>
    </footer>
  );
}
