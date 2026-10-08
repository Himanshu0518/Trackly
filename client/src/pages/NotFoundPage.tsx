import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, Kanban, FileQuestion, Search } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none -z-10" />

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

      {/* Main 404 Container */}
      <div className="max-w-md w-full mx-auto my-auto text-center py-12">
        {/* Animated Badge & Icon */}
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-card border border-border/80 shadow-md mb-6 relative">
          <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold tracking-wider uppercase">
            404
          </div>
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileQuestion className="h-8 w-8 stroke-[1.75]" />
          </div>
        </div>

        {/* Text Details */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-2">
          Page not found
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
          Sorry, the page you are looking for doesn't exist, was removed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full mb-8">
          <Button
            variant="outline"
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
            Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/board")}
            className="w-full sm:w-auto h-10 px-5 gap-2 rounded-xl text-xs font-medium"
          >
            <Kanban className="h-4 w-4" />
            Board
          </Button>
        </div>

        {/* Quick Help Card */}
        <div className="bg-card/60 backdrop-blur-xs border border-border/60 rounded-xl p-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Search className="h-3.5 w-3.5 text-primary" />
          <span>Looking for an issue? Search from your dashboard or issues list.</span>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-muted-foreground/60 max-w-md mx-auto">
        Trackly &copy; {new Date().getFullYear()} &middot; Team Issue &amp; Project Management
      </div>
    </div>
  );
}
