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
import { Plus, Loader2, X, Search, ArrowUpDown, User } from "lucide-react";
import type { IssueFilters, IssueStatus, IssueType, IssuePriority } from "@/types/user.types";

export default function IssuesPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<IssueFilters>({
    sortBy: "createdAt",
    order: "desc",
  });

  // Debounce search input so we don't spam the server on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput.trim() || undefined,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Server-side filtered query
  const { data, isLoading, isFetching } = useGetIssuesQuery(filters, {
    skip: !user,
  });

  // Fetch team members for the assignee filter dropdown
  const { data: membersData } = useGetTeamMembersQuery(undefined, {
    skip: !user,
  });

  const members = membersData?.data ?? [];
  const issues = data?.data ?? [];

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.type ||
    filters.priority ||
    filters.assignedTo ||
    filters.search ||
    filters.sortBy !== "createdAt" ||
    filters.order !== "desc"
  );

  const set = <K extends keyof IssueFilters>(key: K, val: IssueFilters[K] | undefined) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const clearFilters = () => {
    setSearchInput("");
    setFilters({
      sortBy: "createdAt",
      order: "desc",
    });
  };

  const handleSortChange = (val: string | null) => {
    if (!val) return;
    switch (val) {
      case "newest":
        setFilters((prev) => ({ ...prev, sortBy: "createdAt", order: "desc" }));
        break;
      case "oldest":
        setFilters((prev) => ({ ...prev, sortBy: "createdAt", order: "asc" }));
        break;
      case "updated":
        setFilters((prev) => ({ ...prev, sortBy: "updatedAt", order: "desc" }));
        break;
      case "priority":
        setFilters((prev) => ({ ...prev, sortBy: "priority", order: "desc" }));
        break;
      case "title":
        setFilters((prev) => ({ ...prev, sortBy: "title", order: "asc" }));
        break;
      default:
        setFilters((prev) => ({ ...prev, sortBy: "createdAt", order: "desc" }));
    }
  };

  const currentSortKey = (() => {
    if (filters.sortBy === "updatedAt") return "updated";
    if (filters.sortBy === "priority") return "priority";
    if (filters.sortBy === "title") return "title";
    if (filters.sortBy === "createdAt" && filters.order === "asc") return "oldest";
    return "newest";
  })();

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {issues.length} issue{issues.length !== 1 ? "s" : ""} found {isFetching && "· updating…"}
          </p>
        </div>
        <NewIssueDialog>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </NewIssueDialog>
      </div>

      {/* Server-Side Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-xs">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search issues by title or description (server-side)…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Status filter */}
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) => set("status", !v || v === "all" ? undefined : (v as IssueStatus))}
          >
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select
            value={filters.type ?? "all"}
            onValueChange={(v) => set("type", !v || v === "all" ? undefined : (v as IssueType))}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Type: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="BUG">Bug</SelectItem>
              <SelectItem value="FEATURE">Feature</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority filter */}
          <Select
            value={filters.priority ?? "all"}
            onValueChange={(v) => set("priority", !v || v === "all" ? undefined : (v as IssuePriority))}
          >
            <SelectTrigger className="w-34 h-8 text-xs">
              <SelectValue placeholder="Priority: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignee filter */}
          <Select
            value={filters.assignedTo ?? "all"}
            onValueChange={(v) => set("assignedTo", !v || v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <User className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Assignee: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort selector */}
          <Select value={currentSortKey} onValueChange={handleSortChange}>
            <SelectTrigger className="w-38 h-8 text-xs ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
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

      {/* Issues Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : issues.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-foreground">No issues found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Try adjusting or clearing your server filters."
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs">Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue._id}
                  onClick={() => navigate(`/issues/${issue._id}`)}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                    {issue.title}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={issue.type} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={issue.priority} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium text-xs">
                    {issue.assignedTo?.name ? (
                      <span className="text-foreground">{issue.assignedTo.name}</span>
                    ) : (
                      <span className="text-muted-foreground/60 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
