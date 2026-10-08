import { Badge } from "@/components/ui/badge";
import type { IssueStatus, IssuePriority, IssueType } from "@/types/user.types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
}

interface PriorityBadgeProps {
  priority: IssuePriority;
  className?: string;
}

interface TypeBadgeProps {
  type: IssueType;
  className?: string;
}

const STATUS_STYLES: Record<IssueStatus, string> = {
  TODO: "bg-zinc-100 text-zinc-600 border-zinc-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  DONE: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_STYLES: Record<IssuePriority, string> = {
  LOW: "bg-zinc-100 text-zinc-500 border-zinc-200",
  MEDIUM: "bg-blue-50 text-blue-600 border-blue-200",
  HIGH: "bg-orange-50 text-orange-600 border-orange-200",
  CRITICAL: "bg-red-50 text-red-600 border-red-200",
};

const TYPE_STYLES: Record<IssueType, string> = {
  BUG: "bg-red-50 text-red-600 border-red-200",
  FEATURE: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal capitalize lowercase", PRIORITY_STYLES[priority], className)}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  );
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", TYPE_STYLES[type], className)}>
      {type === "BUG" ? "Bug" : "Feature"}
    </Badge>
  );
}
