import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/authSlice";
import { useCurrentUserQuery } from "@/services/auth.services";
import { Loader2 } from "lucide-react";

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
  const { isLoading } = useCurrentUserQuery();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (authentication && !user) {
      navigate("/login", { state: { from: location }, replace: true });
      return;
    }

    if (!authentication && user) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (authentication && user && !user.teamId && !requireNoTeam) {
      navigate("/onboarding/create-team", { replace: true });
      return;
    }
  }, [user, isInitialized, isLoading, authentication, requireNoTeam, navigate, location]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requireAdmin && user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold mb-3 tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            You don't have permission to access this area.
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
