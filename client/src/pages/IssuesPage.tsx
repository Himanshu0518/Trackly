import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetIssuesQuery } from "@/services/issue.services";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ui/status-badge";
import NewIssueDialog from "@/components/issues/NewIssueDialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/authSlice";
import { Plus, Loader2, X } from "lucide-react";
import type { IssueFilters, IssueStatus, IssueType, IssuePriority } from "@/types/user.types";

export default function IssuesPage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [filters, setFilters] = useState<IssueFilters>({});
  const { data, isLoading } = useGetIssuesQuery(filters, { skip: !user });

  const issues = data?.data ?? [];
  const hasFilters = Object.values(filters).some(Boolean);

  const set = <K extends keyof IssueFilters>(key: K, val: IssueFilters[K] | undefined) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const clearFilters = () => setFilters({});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Issues</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{issues.length} result{issues.length !== 1 ? "s" : ""}</p>
        </div>
        <NewIssueDialog>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </NewIssueDialog>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => set("status", v === "all" ? undefined : (v as IssueStatus))}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type ?? "all"}
          onValueChange={(v) => set("type", v === "all" ? undefined : (v as IssueType))}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="FEATURE">Feature</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority ?? "all"}
          onValueChange={(v) => set("priority", v === "all" ? undefined : (v as IssuePriority))}
        >
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No issues found.</div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Title</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Priority</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Assigned to</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue._id}
                  onClick={() => navigate(`/issues/${issue._id}`)}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{issue.title}</td>
                  <td className="px-4 py-3"><TypeBadge type={issue.type} /></td>
                  <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={issue.priority} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{issue.assignedTo?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
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
