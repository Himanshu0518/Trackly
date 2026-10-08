import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ListTodo, Users, Settings, LogOut, ChevronRight, LayoutGrid,
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

  const handleLogout = async () => {
    try {
      await logOut().unwrap();
      dispatch(clearUser());
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const currentPage =
    navItems.find((n) => location.pathname.startsWith(n.href))?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 border-r border-border flex flex-col bg-sidebar">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-xs font-bold">T</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
              Trackly
            </span>
          </div>
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
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
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
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {user ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-sidebar-foreground">
                {user?.name ?? "—"}
              </p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">
                {user?.role ?? ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs h-8"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoggingOut ? "Logging out…" : "Log out"}
          </Button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-background">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Trackly</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{currentPage}</span>
          </div>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
