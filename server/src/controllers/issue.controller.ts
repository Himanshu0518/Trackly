import { Request, Response } from "express";
import { Types } from "mongoose";
import { Issue } from "@/models/index.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import ApiError from "@/utils/api-error.js";
import ApiResponse from "@/utils/api-response.js";
import {
  CreateIssueBody,
  UpdateIssueBody,
  AddCommentBody,
} from "@/validators/issue.validator.js";

// ─── GET /api/issues ──────────────────────────────────────────────────────────
// List all issues for the caller's team, with full server-side filters & search
export const getIssues = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const { status, type, priority, assignedTo, search, sortBy = "createdAt", order = "desc" } =
    req.query as Record<string, string | undefined>;

  const filter: Record<string, unknown> = { teamId };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  if (assignedTo) {
    if (assignedTo === "none" || assignedTo === "unassigned") {
      filter.assignedTo = null;
    } else if (Types.ObjectId.isValid(assignedTo)) {
      filter.assignedTo = new Types.ObjectId(assignedTo);
    }
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ];
  }

  const sortDirection = order === "asc" ? 1 : -1;
  const sortOption: Record<string, 1 | -1> = { [sortBy]: sortDirection };

  const issues = await Issue.find(filter)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort(sortOption);

  res.json(new ApiResponse(issues, "Issues fetched successfully"));
});

// ─── GET /api/issues/:id ──────────────────────────────────────────────────────
export const getIssueById = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const issue = await Issue.findOne({ _id: req.params.id, teamId })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("comments.userId", "name email");

  if (!issue) throw new ApiError("Issue not found", 404);

  res.json(new ApiResponse(issue, "Issue fetched successfully"));
});

// ─── POST /api/issues ─────────────────────────────────────────────────────────
export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const { title, description, type, priority, assignedTo } =
    req.body as CreateIssueBody;

  const issue = await Issue.create({
    title,
    description,
    type,
    priority,
    status: "TODO",
    createdBy: new Types.ObjectId(userId),
    assignedTo: assignedTo ? new Types.ObjectId(assignedTo) : null,
    teamId: new Types.ObjectId(teamId),
  });

  // Populate so the client can add it to its cache without re-fetching the list
  await issue.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
  ]);

  res
    .status(201)
    .json(new ApiResponse(issue, "Issue created successfully", 201));
});

// ─── PATCH /api/issues/:id ────────────────────────────────────────────────────
// Any team member can update — but only the creator or ADMIN can reassign
export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId, role } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const issue = await Issue.findOne({ _id: req.params.id, teamId });
  if (!issue) throw new ApiError("Issue not found", 404);

  const { title, description, type, status, priority, assignedTo } =
    req.body as UpdateIssueBody;

  // Only creator or ADMIN may reassign
  if (
    assignedTo !== undefined &&
    role !== "ADMIN" &&
    issue.createdBy.toString() !== userId
  ) {
    throw new ApiError("Only the creator or an admin can reassign issues", 403);
  }

  if (title !== undefined)       issue.title       = title;
  if (description !== undefined) issue.description = description;
  if (type !== undefined)        issue.type        = type;
  if (status !== undefined)      issue.status      = status;
  if (priority !== undefined)    issue.priority    = priority;
  if (assignedTo !== undefined)
    issue.assignedTo = assignedTo ? new Types.ObjectId(assignedTo) : null;

  await issue.save();

  // Populate so the client can patch its cache without re-fetching
  await issue.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
    { path: "comments.userId", select: "name email" },
  ]);

  res.json(new ApiResponse(issue, "Issue updated successfully"));
});

// ─── DELETE /api/issues/:id ───────────────────────────────────────────────────
// Only creator or ADMIN can delete
export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId, role } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const issue = await Issue.findOne({ _id: req.params.id, teamId });
  if (!issue) throw new ApiError("Issue not found", 404);

  if (role !== "ADMIN" && issue.createdBy.toString() !== userId) {
    throw new ApiError("Only the creator or an admin can delete issues", 403);
  }

  await issue.deleteOne();

  res.json(new ApiResponse(null, "Issue deleted successfully"));
});

// ─── POST /api/issues/:id/comments ───────────────────────────────────────────
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const issue = await Issue.findOne({ _id: req.params.id, teamId });
  if (!issue) throw new ApiError("Issue not found", 404);

  const { text } = req.body as AddCommentBody;

  issue.comments.push({
    userId: new Types.ObjectId(userId),
    text,
    createdAt: new Date(),
  });

  await issue.save();

  // Populate comment authors so the client can show names without re-fetching
  await issue.populate({ path: "comments.userId", select: "name email" });

  res
    .status(201)
    .json(new ApiResponse(issue.comments, "Comment added successfully", 201));
});

// ─── DELETE /api/issues/:id/comments/:commentIndex ───────────────────────────
// Only the comment author or ADMIN can delete a comment
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId, role } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const issue = await Issue.findOne({ _id: req.params.id, teamId });
  if (!issue) throw new ApiError("Issue not found", 404);

  const index = parseInt(String(req.params.commentIndex), 10);
  if (isNaN(index) || index < 0 || index >= issue.comments.length) {
    throw new ApiError("Comment not found", 404);
  }

  const comment = issue.comments[index];
  if (role !== "ADMIN" && comment.userId.toString() !== userId) {
    throw new ApiError("Only the comment author or an admin can delete this comment", 403);
  }

  issue.comments.splice(index, 1);
  await issue.save();

  res.json(new ApiResponse(null, "Comment deleted successfully"));
});
