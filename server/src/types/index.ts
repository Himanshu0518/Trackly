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

export interface IIssue {
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  teamId: Types.ObjectId;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
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
