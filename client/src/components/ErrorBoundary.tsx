import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function ErrorBoundary() {
  const error = useRouteError();
  const Navigate = useNavigate();
  
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
    errorMessage = "An unexpected error occurred";
  }

  // Log error for debugging
  console.error("Route Error:", error);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
            <AlertCircle className="w-10 h-10 text-destructive" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-4xl font-light mb-3 tracking-tight">
            {errorStatus}
          </h1>
          
          <h2 className="text-xl font-light text-muted-foreground mb-6">
            Something went wrong
          </h2>
          
          <p className="text-sm text-muted-foreground/80 mb-8 leading-relaxed">
            {errorMessage}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="rounded-none h-11 px-6 text-xs tracking-wider uppercase"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button
            onClick={() => Navigate('/')}
            className="rounded-none h-11 px-6 text-xs tracking-wider uppercase bg-foreground hover:bg-foreground/90"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>

        {import.meta.env.DEV && error instanceof Error && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-h-64">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}