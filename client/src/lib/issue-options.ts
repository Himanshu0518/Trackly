import type { IssuePriority, IssueStatus, IssueType } from "@/types/user.types";

/**
 * Shared option lists. They are passed to <Select items={...}> so the trigger
 * shows the human label ("In Progress", "Jane Smith") instead of the raw value
 * ("IN_PROGRESS", "665f1c…" Mongo id).
 */
export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const STATUS_OPTIONS: Option<IssueStatus>[] = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export const TYPE_OPTIONS: Option<IssueType>[] = [
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
];

export const PRIORITY_OPTIONS: Option<IssuePriority>[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const STATUS_LABELS: Record<IssueStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const withAll = <T extends string>(label: string, options: Option<T>[]): Option<T | "all">[] => [
  { value: "all", label },
  ...options,
];

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
