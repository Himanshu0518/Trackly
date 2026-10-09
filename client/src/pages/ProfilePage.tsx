import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, CircleDot, Clock, ListChecks,
  AlertCircle, User, Mail, Shield, Pencil, X, Check,
} from "lucide-react";
import { useAppSelector, useAppDispatch, setUser } from "@/store/authSlice";
import { useGetMyStatsQuery, useUpdateMeMutation } from "@/services/auth.services";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { IssueData } from "@/types/user.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

function isOverdue(issue: IssueData): boolean {
  return (
    issue.status !== "DONE" &&
    !!issue.dueDate &&
    new Date(issue.dueDate) < new Date()
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "blue" | "amber" | "green" | "red";
}

const ACCENT = {
  blue:  { bg: "bg-blue-500/10",    text: "text-blue-500",    ring: "ring-blue-500/20" },
  amber: { bg: "bg-amber-500/10",   text: "text-amber-500",   ring: "ring-amber-500/20" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20" },
  red:   { bg: "bg-red-500/10",     text: "text-red-500",     ring: "ring-red-500/20" },
};

function StatCard({ label, value, icon, accent }: StatCardProps) {
  const { bg, text, ring } = ACCENT[accent];
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ring-1 ${ring}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <span className={text}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const { data, isLoading } = useGetMyStatsQuery();
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "");

  const stats = data?.data;

  const handleSave = async () => {
    if (!nameValue.trim() || nameValue === user?.name) {
      setEditing(false);
      return;
    }
    try {
      const res = await updateMe({ name: nameValue.trim() }).unwrap();
      dispatch(setUser(res.data));
      toast.success("Name updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleCancel = () => {
    setNameValue(user?.name ?? "");
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-28 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  const overdueIssues = (stats?.issues ?? []).filter(isOverdue);
  const activeIssues = (stats?.issues ?? []).filter(
    (i) => i.status !== "DONE" && !isOverdue(i)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your personal workload and account info
        </p>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-primary">
            {(user?.name ?? "?")[0].toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name row */}
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="h-8 text-lg font-semibold w-48"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-emerald-500 hover:text-emerald-600"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{user?.name}</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setNameValue(user?.name ?? "");
                    setEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {user?.role}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {stats?.total ?? 0} issues assigned
            </span>
          </div>
        </div>

        {/* Completion ring */}
        {stats && stats.total > 0 && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke="oklch(0.52 0.22 262)"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - stats.completionRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {stats.completionRate}%
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">done</span>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned"    value={stats?.total ?? 0}      icon={<ListChecks className="h-4 w-4" />}    accent="blue" />
        <StatCard label="To Do"       value={stats?.todo ?? 0}        icon={<CircleDot className="h-4 w-4" />}     accent="amber" />
        <StatCard label="Completed"   value={stats?.done ?? 0}        icon={<CheckCircle2 className="h-4 w-4" />}  accent="green" />
        <StatCard label="Overdue"     value={stats?.overdue ?? 0}     icon={<AlertCircle className="h-4 w-4" />}   accent="red" />
      </div>

      {/* ── Overdue issues ── */}
      {overdueIssues.length > 0 && (
        <div className="bg-card border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-red-500" />
            <p className="text-sm font-semibold text-foreground">
              Overdue <span className="text-red-500">({overdueIssues.length})</span>
            </p>
          </div>
          <div className="space-y-2">
            {overdueIssues.map((issue) => (
              <IssueRow key={issue._id} issue={issue} onClick={() => navigate(`/issues/${issue._id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Active issues ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground mb-4">
          Active issues{" "}
          <span className="text-muted-foreground font-normal">
            ({activeIssues.length})
          </span>
        </p>
        {activeIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active issues — you're all caught up 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {activeIssues.map((issue) => (
              <IssueRow key={issue._id} issue={issue} onClick={() => navigate(`/issues/${issue._id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Completed ── */}
      {(stats?.done ?? 0) > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">
            Completed{" "}
            <span className="text-muted-foreground font-normal">({stats!.done})</span>
          </p>
          <div className="space-y-2">
            {(stats?.issues ?? [])
              .filter((i) => i.status === "DONE")
              .map((issue) => (
                <IssueRow key={issue._id} issue={issue} onClick={() => navigate(`/issues/${issue._id}`)} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Issue row ────────────────────────────────────────────────────────────────
function IssueRow({ issue, onClick }: { issue: IssueData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{issue.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {issue.dueDate
            ? `Due ${new Date(issue.dueDate).toLocaleDateString()}`
            : `Updated ${timeAgo(issue.updatedAt)}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <TypeBadge type={issue.type} />
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />
      </div>
    </div>
  );
}
