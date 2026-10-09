import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetIssuesQuery } from "@/services/issue.services";
import { useGetTeamMembersQuery } from "@/services/team.services";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import NewIssueDialog from "@/components/issues/NewIssueDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/authSlice";
import {
  Plus, Loader2, X, Search, ArrowUpDown,
  User, AlertTriangle, CalendarClock,
} from "lucide-react";
import type { IssueFilters, IssueStatus, IssueType, IssuePriority, IssueData } from "@/types/user.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(issue: IssueData): boolean {
  return (
    issue.status !== "DONE" &&
    !!issue.dueDate &&
    new Date(issue.dueDate) < new Date()
  );
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Filter label helpers — show "Status: To Do" not just "To Do" ─────────────

const STATUS_LABELS: Record<string, string> = {
  all: "All statuses",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const TYPE_LABELS: Record<string, string> = {
  all: "All types",
  BUG: "Bug",
  FEATURE: "Feature",
};

const PRIORITY_LABELS: Record<string, string> = {
  all: "All priorities",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  updated: "Recently updated",
  priority: "By priority",
  title: "Title (A–Z)",
  dueDate: "Due date",
};

// ─── Labeled select trigger ───────────────────────────────────────────────────

interface LabeledTriggerProps {
  prefix: string;
  value: string;
  labels: Record<string, string>;
  isActive: boolean;
}

function LabeledValue({ prefix, value, labels, isActive }: LabeledTriggerProps) {
  const label = labels[value] ?? value;
  return (
    <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>
      <span className="text-muted-foreground font-normal">{prefix}:</span>{" "}
      {label}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function IssuesPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [searchInput, setSearchInput] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [filters, setFilters] = useState<IssueFilters>({
    sortBy: "createdAt",
    order: "desc",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput.trim() || undefined,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useGetIssuesQuery(filters, { skip: !user });
  const { data: membersData } = useGetTeamMembersQuery(undefined, { skip: !user });

  const members = membersData?.data ?? [];
  const allIssues = data?.data ?? [];

  // Client-side overdue filter (server doesn't have this filter param)
  const issues = overdueOnly ? allIssues.filter(isOverdue) : allIssues;

  const overdueCount = allIssues.filter(isOverdue).length;

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.type ||
    filters.priority ||
    filters.assignedTo ||
    filters.search ||
    overdueOnly ||
    filters.sortBy !== "createdAt" ||
    filters.order !== "desc"
  );

  const set = <K extends keyof IssueFilters>(key: K, val: IssueFilters[K] | undefined) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const clearFilters = () => {
    setSearchInput("");
    setOverdueOnly(false);
    setFilters({ sortBy: "createdAt", order: "desc" });
  };

  const handleSortChange = (val: string | null) => {
    if (!val) return;
    switch (val) {
      case "newest":   setFilters((p) => ({ ...p, sortBy: "createdAt", order: "desc" })); break;
      case "oldest":   setFilters((p) => ({ ...p, sortBy: "createdAt", order: "asc"  })); break;
      case "updated":  setFilters((p) => ({ ...p, sortBy: "updatedAt", order: "desc" })); break;
      case "priority": setFilters((p) => ({ ...p, sortBy: "priority",  order: "desc" })); break;
      case "title":    setFilters((p) => ({ ...p, sortBy: "title",     order: "asc"  })); break;
      case "dueDate":  setFilters((p) => ({ ...p, sortBy: "dueDate",   order: "asc"  })); break;
      default:         setFilters((p) => ({ ...p, sortBy: "createdAt", order: "desc" }));
    }
  };

  const currentSortKey = (() => {
    if (filters.sortBy === "updatedAt") return "updated";
    if (filters.sortBy === "priority")  return "priority";
    if (filters.sortBy === "title")     return "title";
    if (filters.sortBy === "dueDate")   return "dueDate";
    if (filters.sortBy === "createdAt" && filters.order === "asc") return "oldest";
    return "newest";
  })();

  const assigneeLabel =
    !filters.assignedTo || filters.assignedTo === "all"
      ? "All assignees"
      : filters.assignedTo === "unassigned"
        ? "Unassigned"
        : members.find((m) => m._id === filters.assignedTo)?.name ?? "Assignee";

  return (
    <div className="p-6 space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
            {overdueOnly && ` · ${overdueCount} overdue`}
            {isFetching && " · updating…"}
          </p>
        </div>
        <NewIssueDialog>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </NewIssueDialog>
      </div>

      {/* ── Overdue quick-filter pill ── */}
      {overdueCount > 0 && !overdueOnly && (
        <button
          type="button"
          onClick={() => setOverdueOnly(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-red-500/40 bg-red-500/8 text-red-600 dark:text-red-400 font-medium hover:bg-red-500/15 transition-colors"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {overdueCount} overdue issue{overdueCount !== 1 ? "s" : ""} — click to filter
        </button>
      )}
      {overdueOnly && (
        <button
          type="button"
          onClick={() => setOverdueOnly(false)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-red-500/60 bg-red-500/15 text-red-600 dark:text-red-400 font-medium"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Showing {overdueCount} overdue only
          <X className="h-3 w-3 ml-0.5" />
        </button>
      )}

      {/* ── Filter Bar ── */}
      <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status */}
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => set("status", !v || v === "all" ? undefined : (v as IssueStatus))}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[130px]">
              <LabeledValue
                prefix="Status"
                value={filters.status ?? "all"}
                labels={STATUS_LABELS}
                isActive={!!filters.status}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>

          {/* Type */}
          <Select
            value={filters.type ?? "all"}
            onValueChange={(v) => set("type", !v || v === "all" ? undefined : (v as IssueType))}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[110px]">
              <LabeledValue
                prefix="Type"
                value={filters.type ?? "all"}
                labels={TYPE_LABELS}
                isActive={!!filters.type}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="BUG">Bug</SelectItem>
              <SelectItem value="FEATURE">Feature</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority */}
          <Select
            value={filters.priority ?? "all"}
            onValueChange={(v) => set("priority", !v || v === "all" ? undefined : (v as IssuePriority))}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[130px]">
              <LabeledValue
                prefix="Priority"
                value={filters.priority ?? "all"}
                labels={PRIORITY_LABELS}
                isActive={!!filters.priority}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignee */}
          <Select
            value={filters.assignedTo ?? "all"}
            onValueChange={(v) => set("assignedTo", !v || v === "all" ? undefined : v)}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]">
              <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <span className={filters.assignedTo ? "text-foreground font-medium" : "text-muted-foreground"}>
                <span className="text-muted-foreground font-normal">Assignee:</span>{" "}
                {assigneeLabel}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort — pushed to the right */}
          <Select value={currentSortKey} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[160px] ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                <span className="font-normal">Sort:</span>{" "}
                <span className={currentSortKey !== "newest" ? "text-foreground font-medium" : ""}>
                  {SORT_LABELS[currentSortKey]}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
              <SelectItem value="title">Title (A–Z)</SelectItem>
              <SelectItem value="dueDate">Due date (earliest)</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* ── Issues Table ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : issues.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-foreground">No issues found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Try adjusting or clearing your filters."
              : "Create your first issue to get started."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={clearFilters}>
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Assigned to</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Due date
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => {
                const overdue = isOverdue(issue);
                return (
                  <tr
                    key={issue._id}
                    onClick={() => navigate(`/issues/${issue._id}`)}
                    className={`border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                      overdue
                        ? "bg-red-500/[0.03] hover:bg-red-500/[0.06]"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        {overdue && (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" aria-label="Overdue" />
                        )}
                        <span className="font-medium text-foreground truncate">{issue.title}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <TypeBadge type={issue.type} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={issue.status} />
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <PriorityBadge priority={issue.priority} />
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3 text-xs">
                      {issue.assignedTo?.name ? (
                        <span className="text-foreground font-medium">{issue.assignedTo.name}</span>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3 text-xs">
                      {issue.dueDate ? (
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            overdue ? "text-red-500" : "text-muted-foreground"
                          }`}
                        >
                          {overdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                          {formatDueDate(issue.dueDate)}
                          {overdue && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-semibold">
                              Overdue
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
