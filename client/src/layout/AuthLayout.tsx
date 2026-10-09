import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/authSlice";

interface AuthLayoutProps {
  authentication?: boolean;
  requireAdmin?: boolean;
  requireNoTeam?: boolean;
}

export default function AuthLayout({
  authentication = true,
  requireAdmin = false,
  requireNoTeam = false,
}: AuthLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAppSelector((state) => state.auth.user);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);

  // Onboarding paths that are valid for teamless users
  const onOnboarding =
    location.pathname.startsWith("/onboarding/create-team") ||
    location.pathname.startsWith("/onboarding/waiting");

  useEffect(() => {
    if (!isInitialized) return;

    // Needs auth but no session → login
    if (authentication && !user) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    // Auth not required (login/signup) but already logged in → app
    if (!authentication && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Authenticated, no team, trying to reach a protected app route →
    // send to create-team (user can skip from there to waiting)
    if (authentication && user && !user.teamId && !requireNoTeam) {
      navigate("/onboarding/create-team", { replace: true });
      return;
    }

    // Onboarding routes but user already has a team → go to app
    if (requireNoTeam && user?.teamId) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isInitialized, authentication, requireNoTeam, navigate, location, onOnboarding]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

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
