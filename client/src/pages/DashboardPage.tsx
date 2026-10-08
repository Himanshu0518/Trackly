import { useGetIssuesQuery } from "@/services/issue.services";
import IssueCard from "@/components/issues/IssueCard";
import NewIssueDialog from "@/components/issues/NewIssueDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import type { IssueData, IssueStatus } from "@/types/user.types";

const COLUMNS: { id: IssueStatus; label: string }[] = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "DONE", label: "Done" },
];

export default function DashboardPage() {
  const { data, isLoading, isError } = useGetIssuesQuery();

  const issues = data?.data ?? [];

  const byStatus = (status: IssueStatus): IssueData[] =>
    issues.filter((i) => i.status === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground text-sm">
        Failed to load issues.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{issues.length} issue{issues.length !== 1 ? "s" : ""}</p>
        </div>
        <NewIssueDialog>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </NewIssueDialog>
      </div>

      <div className="grid grid-cols-3 gap-4 h-full">
        {COLUMNS.map(({ id, label }) => {
          const col = byStatus(id);
          return (
            <div key={id} className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
                  {col.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {col.length === 0 ? (
                  <div className="border border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground">
                    No issues
                  </div>
                ) : (
                  col.map((issue) => <IssueCard key={issue._id} issue={issue} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
