import { useNavigate } from "react-router-dom";
import { Clock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/authSlice";
import ThemeToggle from "@/components/ThemeToggle";

export default function WaitingPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <img src="/logo.png" alt="Trackly" className="w-8 h-8 rounded-lg shadow-sm object-contain" />
          <span className="font-semibold text-xl tracking-tight">Trackly</span>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-7 w-7 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Waiting for an invite</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account is ready. Share your email with a team admin and ask
            them to add you — you'll get access as soon as they do.
          </p>
        </div>

        {/* Email chip */}
        {user?.email && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium text-foreground">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {user.email}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {/* Primary: try creating a team instead */}
          <Button
            className="w-full"
            onClick={() => navigate("/onboarding/create-team")}
          >
            Create a team instead
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>

          {/* Already added? refresh session */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground text-sm"
            onClick={() => window.location.reload()}
          >
            I've been added — refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
