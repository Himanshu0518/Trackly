import type { IssueStatus, IssuePriority, IssueType } from "@/types/user.types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: IssueStatus;
  className?: string;
  showDot?: boolean;
}

interface PriorityBadgeProps {
  priority: IssuePriority;
  className?: string;
  showDot?: boolean;
}

interface TypeBadgeProps {
  type: IssueType;
  className?: string;
}

// ─── Status Styles ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; badge: string; dot: string }
> = {
  TODO: {
    label: "To Do",
    badge:
      "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60",
    dot: "bg-slate-400 dark:bg-slate-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
    dot: "bg-blue-500 dark:bg-blue-400 animate-pulse",
  },
  DONE: {
    label: "Done",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
};

// ─── Priority Styles ───────────────────────────────────────────────────────────
const PRIORITY_CONFIG: Record<
  IssuePriority,
  { label: string; badge: string; dot: string }
> = {
  LOW: {
    label: "Low",
    badge:
      "bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
  MEDIUM: {
    label: "Medium",
    badge:
      "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60",
    dot: "bg-sky-500 dark:bg-sky-400",
  },
  HIGH: {
    label: "High",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  CRITICAL: {
    label: "Critical",
    badge:
      "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
    dot: "bg-rose-500 dark:bg-rose-400",
  },
};

// ─── Type Styles ───────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  IssueType,
  { label: string; badge: string }
> = {
  BUG: {
    label: "Bug",
    badge:
      "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60",
  },
  FEATURE: {
    label: "Feature",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60",
  },
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border tracking-tight transition-colors whitespace-nowrap",
        config.badge,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />}
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority, className, showDot = true }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border tracking-tight transition-colors whitespace-nowrap",
        config.badge,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />}
      {config.label}
    </span>
  );
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.FEATURE;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border tracking-tight transition-colors whitespace-nowrap",
        config.badge,
        className
      )}
    >
      {config.label}
    </span>
  );
}
