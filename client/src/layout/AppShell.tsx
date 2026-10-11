import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ListTodo, Users, Settings, LogOut, ChevronRight, LayoutGrid, UserCircle2, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAppSelector, useAppDispatch } from "@/store/authSlice";
import { useLogOutMutation } from "@/services/auth.services";
import { clearUser } from "@/store/authSlice";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { tokenStore } from "@/lib/token-store";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Board",     href: "/board",     icon: LayoutGrid },
  { label: "Issues",    href: "/issues",    icon: ListTodo },
  { label: "Team",      href: "/team",      icon: Users },
  { label: "Settings",  href: "/settings",  icon: Settings },
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logOut, { isLoading: isLoggingOut }] = useLogOutMutation();

  // Below `lg` the sidebar becomes an off-canvas drawer opened from the header.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer after navigating
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Esc closes the drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleLogout = async () => {
    try {
      await logOut().unwrap();
      tokenStore.clear(); // remove the Bearer token so no stale header is sent
      dispatch(clearUser());
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const currentPage =
    navItems.find((n) => location.pathname.startsWith(n.href))?.label ??
    (location.pathname === "/profile" ? "Profile" : "Dashboard");

  return (
    // h-dvh (not h-screen) so mobile browser toolbars don't push content off-screen
    <div className="flex h-dvh bg-background overflow-hidden">
      {/* ── Drawer backdrop (mobile / tablet only) ───────────────────────── */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        id="app-sidebar"
        className={cn(
          "flex flex-col bg-sidebar border-r border-border",
          // mobile/tablet: slides in over the content
          "fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transition-all duration-200",
          drawerOpen ? "translate-x-0 visible" : "-translate-x-full invisible",
          // laptop+: always visible, part of the flex layout
          "lg:static lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0 lg:visible lg:flex-shrink-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Trackly logo"
              className="w-7 h-7 rounded-lg object-contain"
            />
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
              Trackly
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden text-sidebar-foreground/60"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active =
              location.pathname === href ||
              location.pathname.startsWith(href + "/");
            return (
              <button
                key={href}
                onClick={() => navigate(href)}
                className={cn(
                  // taller tap target on touch screens, compact on laptop
                  "w-full flex items-center gap-2.5 px-3 py-2.5 lg:py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "")}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User footer */}
        <div className="p-3 space-y-1 shrink-0">
          <button
            onClick={() => navigate("/profile")}
            className={cn(
              "w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors group",
              location.pathname === "/profile"
                ? "bg-primary/10"
                : "hover:bg-sidebar-accent"
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback
                className={cn(
                  "text-[10px] font-semibold",
                  location.pathname === "/profile"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                {user ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className={cn(
                "text-xs font-medium truncate",
                location.pathname === "/profile"
                  ? "text-primary"
                  : "text-sidebar-foreground"
              )}>
                {user?.name ?? "—"}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                {user?.role ?? ""}
              </p>
            </div>
            <UserCircle2 className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              location.pathname === "/profile"
                ? "text-primary"
                : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60"
            )} />
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs h-9 lg:h-8"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      {/* min-w-0 lets this flex child shrink below its content width, which is
          what stops wide tables/charts from forcing horizontal page scroll */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between gap-3 px-4 sm:px-6 flex-shrink-0 bg-background">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden -ml-1.5 shrink-0"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="app-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
              <span className="hidden sm:inline">Trackly</span>
              <ChevronRight className="h-3.5 w-3.5 hidden sm:inline shrink-0" />
              <span className="text-foreground font-medium truncate">{currentPage}</span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
