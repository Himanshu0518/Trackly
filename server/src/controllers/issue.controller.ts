import { Request, Response } from "express";
import { Types } from "mongoose";
import { Issue, Notification, User } from "@/models/index.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import ApiError from "@/utils/api-error.js";
import ApiResponse from "@/utils/api-response.js";
import {
  CreateIssueBody,
  UpdateIssueBody,
  AddCommentBody,
} from "@/validators/issue.validator.js";
import {
  createNotification,
  findMentionedUsers,
  CreateNotificationParams,
} from "@/utils/notification.util.js";

// Fields a client is allowed to sort issues by (blocks arbitrary keys in the
// Mongo sort clause)
const SORTABLE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "title",
  "priority",
  "status",
  "dueDate",
]);

/**
 * Ensures an assignedTo value is a valid ObjectId belonging to the caller's
 * team. Prevents cross-tenant assignment (and the cross-tenant notification
 * that would follow).
 */
async function assertTeamMember(
  userIdToCheck: string,
  teamId: string
): Promise<void> {
  if (!Types.ObjectId.isValid(userIdToCheck)) {
    throw new ApiError("Invalid assignee ID", 422);
  }

  const assignee = await User.findOne({
    _id: userIdToCheck,
    teamId,
  }).select("_id");

  if (!assignee) {
    throw new ApiError("Assignee must be a member of your team", 422);
  }
}

// ─── GET /api/issues ──────────────────────────────────────────────────────────
// List all issues for the caller's team, with full server-side filters & search
export const getIssues = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const {
    status,
    type,
    priority,
    assignedTo,
    search,
    sortBy = "createdAt",
    order = "desc",
  } = req.query as Record<string, string | undefined>;

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
    const searchRegex = new RegExp(
      search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    filter.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
    ];
  }

  const sortDirection = order === "asc" ? 1 : -1;
  const sortField = SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const sortOption: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const issues = await Issue.find(filter)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort(sortOption);

  res.json(new ApiResponse(issues, "Issues fetched successfully"));
});

// ─── GET /api/issues/:id ──────────────────────────────────────────────────────
export const getIssueById = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 403);

    const issue = await Issue.findOne({ _id: req.params.id, teamId })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.userId", "name email")
      .populate("activities.userId", "name email");

    if (!issue) throw new ApiError("Issue not found", 404);

    res.json(new ApiResponse(issue, "Issue fetched successfully"));
  }
);

// ─── POST /api/issues ─────────────────────────────────────────────────────────
export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 403);

  const { title, description, type, priority, assignedTo, dueDate } =
    req.body as CreateIssueBody;

  // Reject assignees outside the caller's team (also rejects malformed IDs)
  if (assignedTo) {
    await assertTeamMember(assignedTo, teamId);
  }

  const issue = await Issue.create({
    title,
    description,
    type,
    priority,
    status: "TODO",
    dueDate: dueDate ? new Date(dueDate) : null,
    createdBy: new Types.ObjectId(userId),
    assignedTo: assignedTo ? new Types.ObjectId(assignedTo) : null,
    teamId: new Types.ObjectId(teamId),
    activities: [
      {
        userId: new Types.ObjectId(userId),
        type: "CREATED",
        createdAt: new Date(),
      },
    ],
  });

  // Populate so the client can add it to its cache without re-fetching the list
  await issue.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
    { path: "activities.userId", select: "name email" },
  ]);

  // Send assignment notification if assigned to another user
  if (assignedTo && assignedTo.toString() !== userId) {
    const creator = await User.findById(userId).select("name");
    const creatorName = creator?.name || "A team member";
    await createNotification({
      recipient: assignedTo,
      sender: userId,
      teamId,
      issueId: issue._id as Types.ObjectId,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: `${creatorName} assigned you to "${issue.title}"`,
      link: `/issues/${issue._id}`,
    });
  }

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

  const { title, description, type, status, priority, assignedTo, dueDate } =
    req.body as UpdateIssueBody;

  // Only creator or ADMIN may reassign
  if (
    assignedTo !== undefined &&
    role !== "ADMIN" &&
    issue.createdBy.toString() !== userId
  ) {
    throw new ApiError("Only the creator or an admin can reassign issues", 403);
  }

  // Reject assignees outside the caller's team (also rejects malformed IDs)
  if (assignedTo) {
    await assertTeamMember(assignedTo, teamId);
  }

  const currentUser = await User.findById(userId).select("name");
  const updaterName = currentUser?.name || "A team member";

  if (!issue.activities) {
    issue.activities = [];
  }

  // Notifications are queued here but only dispatched after issue.save()
  // succeeds, so a failed save never notifies about a change that didn't
  // happen.
  const pendingNotifications: CreateNotificationParams[] = [];

  // Track status change
  if (status !== undefined && status !== issue.status) {
    const oldStatus = issue.status;
    issue.status = status;
    issue.activities.push({
      userId: new Types.ObjectId(userId),
      type: "STATUS_CHANGE",
      field: "status",
      oldValue: oldStatus,
      newValue: status,
      createdAt: new Date(),
    });

    // Notify assignee if someone else changed status
    if (issue.assignedTo && issue.assignedTo.toString() !== userId) {
      pendingNotifications.push({
        recipient: issue.assignedTo,
        sender: userId,
        teamId,
        issueId: issue._id as Types.ObjectId,
        type: "STATUS_CHANGED",
        title: "Task Status Updated",
        message: `${updaterName} moved "${issue.title}" to ${status}`,
        link: `/issues/${issue._id}`,
      });
    }
  }

  // Track priority change
  if (priority !== undefined && priority !== issue.priority) {
    const oldPriority = issue.priority;
    issue.priority = priority;
    issue.activities.push({
      userId: new Types.ObjectId(userId),
      type: "PRIORITY_CHANGE",
      field: "priority",
      oldValue: oldPriority,
      newValue: priority,
      createdAt: new Date(),
    });

    // Notify assignee if someone else escalated/de-escalated priority
    if (issue.assignedTo && issue.assignedTo.toString() !== userId) {
      pendingNotifications.push({
        recipient: issue.assignedTo,
        sender: userId,
        teamId,
        issueId: issue._id as Types.ObjectId,
        type: "PRIORITY_CHANGED",
        title: "Task Priority Updated",
        message: `${updaterName} changed "${issue.title}" priority to ${priority}`,
        link: `/issues/${issue._id}`,
      });
    }
  }

  // Track assignment change
  if (assignedTo !== undefined) {
    const oldAssigneeId = issue.assignedTo ? issue.assignedTo.toString() : null;
    const newAssigneeId = assignedTo ? assignedTo.toString() : null;

    if (oldAssigneeId !== newAssigneeId) {
      issue.assignedTo = assignedTo ? new Types.ObjectId(assignedTo) : null;
      issue.activities.push({
        userId: new Types.ObjectId(userId),
        type: "ASSIGNMENT_CHANGE",
        field: "assignedTo",
        oldValue: oldAssigneeId ?? "unassigned",
        newValue: newAssigneeId ?? "unassigned",
        createdAt: new Date(),
      });

      // Notify the newly assigned user
      if (newAssigneeId && newAssigneeId !== userId) {
        pendingNotifications.push({
          recipient: newAssigneeId,
          sender: userId,
          teamId,
          issueId: issue._id as Types.ObjectId,
          type: "TASK_ASSIGNED",
          title: "Task Reassigned",
          message: `${updaterName} assigned you to "${issue.title}"`,
          link: `/issues/${issue._id}`,
        });
      }
    }
  }

  if (title !== undefined) issue.title = title;
  if (description !== undefined) issue.description = description;
  if (type !== undefined) issue.type = type;
  if (dueDate !== undefined)
    issue.dueDate = dueDate ? new Date(dueDate) : null;

  await issue.save();

  // Only now that the change is persisted do we notify teammates
  for (const notification of pendingNotifications) {
    await createNotification(notification);
  }

  // Populate so the client can patch its cache without re-fetching
  await issue.populate([
    { path: "createdBy", select: "name email" },
    { path: "assignedTo", select: "name email" },
    { path: "comments.userId", select: "name email" },
    { path: "activities.userId", select: "name email" },
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

  // Remove notifications pointing at the deleted issue so recipients don't
  // click through to a 404
  await Notification.deleteMany({ issueId: issue._id });

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

  // Handle @mentions and notifications asynchronously
  const commenter = await User.findById(userId).select("name");
  const commenterName = commenter?.name || "A team member";
  const truncatedText = text.length > 80 ? `${text.slice(0, 77)}...` : text;

  // 1. Check for @mentions in comment text
  const mentionedMembers = await findMentionedUsers(text, teamId);
  const mentionedMemberIds = new Set<string>();

  for (const member of mentionedMembers) {
    const memberIdStr = member._id.toString();
    if (memberIdStr !== userId) {
      mentionedMemberIds.add(memberIdStr);
      await createNotification({
        recipient: member._id as Types.ObjectId,
        sender: userId,
        teamId,
        issueId: issue._id as Types.ObjectId,
        type: "MENTIONED_IN_COMMENT",
        title: "Mentioned in comment",
        message: `${commenterName} tagged you on "${issue.title}": "${truncatedText}"`,
        link: `/issues/${issue._id}`,
      });
    }
  }

  // 2. Notify assignee if not commenter and not already notified via mention
  if (
    issue.assignedTo &&
    issue.assignedTo.toString() !== userId &&
    !mentionedMemberIds.has(issue.assignedTo.toString())
  ) {
    await createNotification({
      recipient: issue.assignedTo,
      sender: userId,
      teamId,
      issueId: issue._id as Types.ObjectId,
      type: "COMMENT_ADDED",
      title: "New comment on your task",
      message: `${commenterName} commented on "${issue.title}": "${truncatedText}"`,
      link: `/issues/${issue._id}`,
    });
  }

  res
    .status(201)
    .json(new ApiResponse(issue.comments, "Comment added successfully", 201));
});

// ─── DELETE /api/issues/:id/comments/:commentIndex ───────────────────────────
// Only the comment author or ADMIN can delete a comment
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
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
      throw new ApiError(
        "Only the comment author or an admin can delete this comment",
        403
      );
    }

    issue.comments.splice(index, 1);
    await issue.save();

    res.json(new ApiResponse(null, "Comment deleted successfully"));
  }
);
