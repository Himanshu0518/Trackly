import { Request, Response } from "express";
import { Issue, User } from "@/models/index.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import ApiError from "@/utils/api-error.js";
import ApiResponse from "@/utils/api-response.js";
import type { IssuePriority, IssueType } from "@/types/index.js";

const TREND_DAYS = 14;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ─── GET /api/dashboard/stats ────────────────────────────────────────────────
// Returns aggregated dashboard analytics calculated completely on the server
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  // Fetch all issues for the team with populated references
  const issues = await Issue.find({ teamId })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .lean();

  const openByPriority: Record<IssuePriority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  const byType: Record<IssueType, { open: number; done: number }> = {
    BUG: { open: 0, done: 0 },
    FEATURE: { open: 0, done: 0 },
  };

  const workloadMap = new Map<string, { name: string; open: number; done: number }>();

  let todo = 0;
  let inProgress = 0;
  let done = 0;

  // Build daily buckets for the past TREND_DAYS
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = new Map<
    string,
    { key: string; label: string; created: number; resolved: number }
  >();

  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    buckets.set(key, {
      key,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      created: 0,
      resolved: 0,
    });
  }

  for (const issue of issues) {
    const isDone = issue.status === "DONE";
    if (issue.status === "TODO") {
      todo++;
    } else if (issue.status === "IN_PROGRESS") {
      inProgress++;
    } else {
      done++;
    }

    if (byType[issue.type]) {
      if (isDone) {
        byType[issue.type].done++;
      } else {
        byType[issue.type].open++;
      }
    }

    if (!isDone && openByPriority[issue.priority] !== undefined) {
      openByPriority[issue.priority]++;
    }

    // Workload calculation
    const assignedUser = issue.assignedTo as { name?: string } | null;
    const assigneeName = assignedUser?.name ?? "Unassigned";
    const row = workloadMap.get(assigneeName) ?? { name: assigneeName, open: 0, done: 0 };
    if (isDone) {
      row.done++;
    } else {
      row.open++;
    }
    workloadMap.set(assigneeName, row);

    // Trend calculation
    if (issue.createdAt) {
      const createdBucket = buckets.get(dayKey(new Date(issue.createdAt)));
      if (createdBucket) {
        createdBucket.created++;
      }
    }

    if (isDone && issue.updatedAt) {
      const resolvedBucket = buckets.get(dayKey(new Date(issue.updatedAt)));
      if (resolvedBucket) {
        resolvedBucket.resolved++;
      }
    }
  }

  const trend = [...buckets.values()];
  const total = issues.length;
  const open = todo + inProgress;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // Recent 6 issues sorted by updatedAt
  const recent = [...issues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const stats = {
    total,
    todo,
    inProgress,
    open,
    done,
    completionRate,
    openByPriority,
    byType,
    trend,
    createdInRange: trend.reduce((sum, t) => sum + t.created, 0),
    resolvedInRange: trend.reduce((sum, t) => sum + t.resolved, 0),
    workload: [...workloadMap.values()].sort((a, b) => b.open + b.done - (a.open + a.done)),
    recent,
  };

  res.json(new ApiResponse(stats, "Dashboard analytics fetched successfully"));
});
