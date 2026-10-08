import type { IssueData, IssuePriority, IssueType } from "@/types/user.types";

export const TREND_DAYS = 14;

export interface TrendPoint {
  key: string;
  label: string;
  created: number;
  resolved: number;
}

export interface WorkloadRow {
  name: string;
  open: number;
  done: number;
}

export interface IssueStats {
  total: number;
  todo: number;
  inProgress: number;
  /** "Not solved" = To Do + In Progress */
  open: number;
  /** "Solved" */
  done: number;
  completionRate: number;
  openByPriority: Record<IssuePriority, number>;
  byType: Record<IssueType, { open: number; done: number }>;
  trend: TrendPoint[];
  createdInRange: number;
  resolvedInRange: number;
  workload: WorkloadRow[];
  recent: IssueData[];
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Everything on the dashboard is derived from the single cached GET /issues
 * response, so the analytics cost zero additional API calls.
 *
 * Note: the API stores no "resolved at" timestamp, so a DONE issue is counted
 * as resolved on the day it was last updated.
 */
export function computeIssueStats(issues: IssueData[]): IssueStats {
  const openByPriority: Record<IssuePriority, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const byType: Record<IssueType, { open: number; done: number }> = {
    BUG: { open: 0, done: 0 },
    FEATURE: { open: 0, done: 0 },
  };
  const workloadMap = new Map<string, WorkloadRow>();

  let todo = 0;
  let inProgress = 0;
  let done = 0;

  // Pre-build the last N day buckets (oldest → newest)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<string, TrendPoint>();
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.set(dayKey(d), {
      key: dayKey(d),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      created: 0,
      resolved: 0,
    });
  }

  for (const issue of issues) {
    const isDone = issue.status === "DONE";
    if (issue.status === "TODO") todo++;
    else if (issue.status === "IN_PROGRESS") inProgress++;
    else done++;

    if (isDone) byType[issue.type].done++;
    else {
      byType[issue.type].open++;
      openByPriority[issue.priority]++;
    }

    const who = issue.assignedTo?.name ?? "Unassigned";
    const row = workloadMap.get(who) ?? { name: who, open: 0, done: 0 };
    if (isDone) row.done++;
    else row.open++;
    workloadMap.set(who, row);

    const created = buckets.get(dayKey(new Date(issue.createdAt)));
    if (created) created.created++;
    if (isDone) {
      const resolved = buckets.get(dayKey(new Date(issue.updatedAt)));
      if (resolved) resolved.resolved++;
    }
  }

  const trend = [...buckets.values()];
  const total = issues.length;

  return {
    total,
    todo,
    inProgress,
    open: todo + inProgress,
    done,
    completionRate: total ? Math.round((done / total) * 100) : 0,
    openByPriority,
    byType,
    trend,
    createdInRange: trend.reduce((s, t) => s + t.created, 0),
    resolvedInRange: trend.reduce((s, t) => s + t.resolved, 0),
    workload: [...workloadMap.values()].sort((a, b) => b.open + b.done - (a.open + a.done)),
    recent: [...issues]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6),
  };
}

export function timeAgo(iso: string): string {
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
