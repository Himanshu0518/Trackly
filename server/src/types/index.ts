import { Types } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "MEMBER";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  teamId: Types.ObjectId | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Team ────────────────────────────────────────────────────────────────────

export interface ITeam {
  name: string;
  description: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Issue ───────────────────────────────────────────────────────────────────

export type IssueType = "BUG" | "FEATURE";
export type IssueStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IComment {
  userId: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export type ActivityType =
  | "CREATED"
  | "STATUS_CHANGE"
  | "PRIORITY_CHANGE"
  | "ASSIGNMENT_CHANGE";

export interface IIssueActivity {
  userId: Types.ObjectId;
  type: ActivityType;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

export interface IIssue {
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate?: Date | null;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  teamId: Types.ObjectId;
  comments: IComment[];
  activities?: IIssueActivity[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "TASK_ASSIGNED"
  | "MENTIONED_IN_COMMENT"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "COMMENT_ADDED";

export interface INotification {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  teamId: Types.ObjectId;
  issueId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  role: UserRole;
  teamId: string | null;
}

// Extends Express Request so controllers get req.user typed
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── API utilities ────────────────────────────────────────────────────────────

export interface IApiError {
  statusCode: number;
  message: string;
  errors: string[];
  success: false;
  data: null;
}

export interface IApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  success: boolean;
  data: T;
}
