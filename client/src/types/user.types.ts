// ─── Enums ────────────────────────────────────────────────────────────────────
export type UserRole = "ADMIN" | "MEMBER";
export type IssueType = "BUG" | "FEATURE";
export type IssueStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ─── Domain models ────────────────────────────────────────────────────────────
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  teamId: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeam {
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  userId: string;
  text: string;
  createdAt: Date;
}

export interface IIssue {
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate?: string | null;
  createdBy: string;
  assignedTo: string | null;
  teamId: string;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── API utilities ─────────────────────────────────────────────────────────────
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

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUserData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    teamId: string | null;
  };
}

export type AuthResponse = IApiResponse<AuthUserData>;

// ─── Current user (GET /users/me) ─────────────────────────────────────────────
export interface MeUserData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  // Present on GET/PATCH /users/me, absent when built from a login/signup response
  createdAt?: string;
  updatedAt?: string;
}
export type MeResponse = IApiResponse<MeUserData>;

// ─── Team ─────────────────────────────────────────────────────────────────────
export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export interface TeamData {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type TeamResponse = IApiResponse<TeamData>;
export type CreateTeamResponse = IApiResponse<{ team: TeamData; token: string }>;

// ─── Members ──────────────────────────────────────────────────────────────────
export interface MemberData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}

export type MembersResponse = IApiResponse<MemberData[]>;
export type AllUserResponse = IApiResponse<MemberData[]>;

export interface AddMemberPayload {
  userId: string;
}

// ─── Issues ───────────────────────────────────────────────────────────────────
export interface CreateIssuePayload {
  title: string;
  description?: string;
  type: IssueType;
  priority: IssuePriority;
  assignedTo?: string;
  dueDate?: string | null;
}

export interface UpdateIssuePayload {
  id: string;
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignedTo?: string | null;
  dueDate?: string | null;
}

export interface IssueFilters {
  status?: IssueStatus;
  type?: IssueType;
  priority?: IssuePriority;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

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

export interface DashboardStats {
  total: number;
  todo: number;
  inProgress: number;
  open: number;
  done: number;
  overdue: number;
  completionRate: number;
  openByPriority: Record<IssuePriority, number>;
  byType: Record<IssueType, { open: number; done: number }>;
  trend: TrendPoint[];
  createdInRange: number;
  resolvedInRange: number;
  workload: WorkloadRow[];
  recent: IssueData[];
}

export type DashboardResponse = IApiResponse<DashboardStats>;

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

export interface CommentData {
  _id: string;
  userId: PopulatedUser;
  text: string;
  createdAt: string;
}

export interface IssueData {
  _id: string;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate?: string | null;
  createdBy: PopulatedUser;
  assignedTo: PopulatedUser | null;
  teamId: string;
  comments: CommentData[];
  createdAt: string;
  updatedAt: string;
}

export type IssueResponse = IApiResponse<IssueData>;
export type IssuesResponse = IApiResponse<IssueData[]>;

export interface AddCommentPayload {
  id: string;
  text: string;
}

export interface DeleteCommentPayload {
  id: string;
  commentIndex: number;
}

export type CommentsResponse = IApiResponse<CommentData[]>;

// ─── Update me ────────────────────────────────────────────────────────────────
export interface UpdateMePayload {
  name: string;
}

// ─── User search (GET /users/search?q=) ──────────────────────────────────────
export interface UserSearchResult {
  _id: string;
  name: string;
  email: string;
}

export type UserSearchResponse = IApiResponse<UserSearchResult[]>;
