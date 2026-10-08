import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/authSlice";

interface AuthLayoutProps {
  /** true  → route requires a logged-in user */
  authentication?: boolean;
  /** true  → route requires ADMIN role */
  requireAdmin?: boolean;
  /** true  → route is for users who have NO team yet (onboarding) */
  requireNoTeam?: boolean;
}

/**
 * AuthLayout — reads auth state from Redux only.
 * RootLayout already fired /users/me on boot; no duplicate call here.
 */
export default function AuthLayout({
  authentication = true,
  requireAdmin = false,
  requireNoTeam = false,
}: AuthLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAppSelector((state) => state.auth.user);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    // Needs auth but no session → send to login
    if (authentication && !user) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    // Doesn't need auth (login/signup) but already logged in → go to app
    if (!authentication && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Needs auth + a team, but user has no team → onboarding
    if (authentication && user && !user.teamId && !requireNoTeam) {
      navigate("/onboarding/create-team", { replace: true });
      return;
    }

    // Onboarding route but user already has a team → go to app
    if (requireNoTeam && user?.teamId) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isInitialized, authentication, requireNoTeam, navigate, location]);

  // Still waiting for the boot-time auth check
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  // Admin-only page but user isn't admin
  if (requireAdmin && user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-5">
            <AlertCircle className="h-7 w-7 text-destructive" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold mb-2 tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You don't have permission to access this area.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
