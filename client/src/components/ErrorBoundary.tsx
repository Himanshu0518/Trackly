import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LayoutDashboard, ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage: string;
  let errorStatus: string | number = "Error";

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = "An unexpected error occurred while processing your request.";
  }

  // Log error for debugging
  console.error("Trackly Route Error:", error);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <img
            src="/logo.png"
            alt="Trackly"
            className="h-9 w-9 rounded-xl object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-lg tracking-tight text-foreground">
            Trackly
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Center card */}
      <div className="max-w-lg w-full mx-auto my-auto text-center py-10">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-md mb-6 relative">
          <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-7 w-7 stroke-[1.75]" />
          </div>
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold mb-3">
          Status {errorStatus}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
          Something unexpected occurred
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
          {errorMessage}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto h-10 px-5 gap-2 rounded-xl text-xs font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto h-10 px-5 gap-2 rounded-xl text-xs font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto h-10 px-5 gap-2 rounded-xl text-xs font-medium shadow-sm"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Developer trace when in DEV mode */}
        {import.meta.env.DEV && error instanceof Error && (
          <details className="mt-6 text-left bg-card/80 border border-border/80 rounded-xl p-4 text-xs">
            <summary className="font-mono text-muted-foreground cursor-pointer hover:text-foreground font-medium">
              View error stack trace (Development only)
            </summary>
            <pre className="mt-3 p-3 bg-muted/60 rounded-lg text-[11px] font-mono overflow-auto max-h-52 text-foreground/80 leading-normal">
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground/60 max-w-md mx-auto">
        Trackly &copy; {new Date().getFullYear()} &middot; Team Issue &amp; Project Management
      </div>
    </div>
  );
}