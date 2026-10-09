import { useGetDashboardStatsQuery } from "@/services/issue.services";
import { useAppSelector } from "@/store/authSlice";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  CheckCircle2, CircleDot, AlertCircle, ListChecks,
  TrendingUp, Users, Zap, Activity, Clock,
} from "lucide-react";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import { useNavigate } from "react-router-dom";

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  accent?: "blue" | "green" | "amber" | "red" | "purple";
}

const ACCENT_MAP = {
  blue:   { bg: "bg-blue-500/10",    text: "text-blue-500",    ring: "ring-blue-500/20" },
  green:  { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/20" },
  amber:  { bg: "bg-amber-500/10",   text: "text-amber-500",   ring: "ring-amber-500/20" },
  red:    { bg: "bg-red-500/10",     text: "text-red-500",     ring: "ring-red-500/20" },
  purple: { bg: "bg-purple-500/10",  text: "text-purple-500",  ring: "ring-purple-500/20" },
};

function StatCard({ label, value, icon, sub, accent = "blue" }: StatCardProps) {
  const { bg, text, ring } = ACCENT_MAP[accent];
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ring-1 ${ring} hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <span className={text}>{icon}</span>
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  // Directly fetch server-calculated stats (no calculations on UI)
  const { data, isLoading, isError } = useGetDashboardStatsQuery(undefined, {
    skip: !user,
  });

  const stats = data?.data;

  // Chart colours that respect the design system
  const CHART_COLORS = {
    created:  "oklch(0.60 0.22 262)",
    resolved: "oklch(0.64 0.16 220)",
    open:     "oklch(0.74 0.12 196)",
    done:     "oklch(0.52 0.22 262)",
  };

  const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: "#ef4444",
    HIGH:     "#f97316",
    MEDIUM:   "#eab308",
    LOW:      "#22c55e",
  };

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground text-sm">
        Failed to load analytics.
      </div>
    );
  }

  const pieData = [
    { name: "To Do",       value: stats.todo,       fill: "#64748b" },
    { name: "In Progress", value: stats.inProgress, fill: "#f97316" },
    { name: "Done",        value: stats.done,       fill: "#22c55e" },
  ].filter((d) => d.value > 0);

  const priorityData = (Object.entries(stats.openByPriority ?? {}) as [string, number][])
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, fill: PRIORITY_COLORS[name] }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time server analytics and metrics overview
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Issues"
          value={stats.total}
          icon={<ListChecks className="h-4 w-4" />}
          sub="All team issues"
          accent="blue"
        />
        <StatCard
          label="Solved"
          value={stats.done}
          icon={<CheckCircle2 className="h-4 w-4" />}
          sub={`${stats.completionRate}% completion rate`}
          accent="green"
        />
        <StatCard
          label="Not Solved"
          value={stats.open}
          icon={<CircleDot className="h-4 w-4" />}
          sub={`${stats.todo} to do · ${stats.inProgress} in progress`}
          accent="amber"
        />
        <StatCard
          label="Critical / High"
          value={(stats.openByPriority?.CRITICAL ?? 0) + (stats.openByPriority?.HIGH ?? 0)}
          icon={<AlertCircle className="h-4 w-4" />}
          sub="Open high-priority issues"
          accent="red"
        />
      </div>

      {/* ── Overdue banner (only shown when there are overdue issues) ── */}
      {(stats.overdue ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3">
          <Clock className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">
            <span className="font-semibold">{stats.overdue}</span>{" "}
            {stats.overdue === 1 ? "issue is" : "issues are"} past their due date
          </p>
        </div>
      )}

      {/* ── Row 2: Trend + Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart (2/3 width) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Issue History &amp; Trend (14 days)</p>
          </div>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full bg-blue-500 inline-block" /> Created ({stats.createdInRange})
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-0.5 rounded-full bg-teal-400 inline-block" /> Resolved ({stats.resolvedInRange})
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.created} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.created} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.resolved} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.resolved} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="created" name="Created" stroke={CHART_COLORS.created} fill="url(#gCreated)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke={CHART_COLORS.resolved} fill="url(#gResolved)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie (1/3 width) */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Status Breakdown</p>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">No issues yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </span>
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Priority + Workload ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority of open issues */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Open Issues by Priority</p>
          </div>
          {priorityData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">No open issues 🎉</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Issues" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team workload */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Team Workload</p>
          </div>
          {(stats.workload ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">No assignments yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.workload} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="open" name="Open" fill={CHART_COLORS.open} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="done" name="Done" fill={CHART_COLORS.done} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {(stats.recent ?? []).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Recent Activity</p>
          <div className="space-y-3">
            {stats.recent.map((issue) => (
              <div
                key={issue._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/issues/${issue._id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{issue.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {issue.assignedTo ? `Assigned to ${issue.assignedTo.name}` : "Unassigned"} · {timeAgo(issue.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <TypeBadge type={issue.type} />
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
