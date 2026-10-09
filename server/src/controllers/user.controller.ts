import { Request, Response } from "express";
import { User, Issue } from "@/models/index.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import ApiError from "@/utils/api-error.js";
import ApiResponse from "@/utils/api-response.js";

// GET /api/users/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId).select("-passwordHash");
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.json(new ApiResponse(user, "User fetched successfully"));
});

// PATCH /api/users/me
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };

  const user = await User.findByIdAndUpdate(
    req.user!.userId,
    { ...(name && { name }) },
    { new: true, runValidators: true }
  ).select("-passwordHash");

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.json(new ApiResponse(user, "Profile updated successfully"));
});

// GET /api/users/search?q=<query>
// Returns users whose name or email matches the query string.
// Only returns users who are not already part of a team (eligible to be added).
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? "";

  if (q.length < 2) {
    res.json(new ApiResponse([], "Query too short"));
    return;
  }

  const regex = new RegExp(q, "i");

  const users = await User.find({
    teamId: null, // only users without a team
    $or: [{ name: regex }, { email: regex }],
  })
    .select("_id name email")
    .limit(10);

  res.json(new ApiResponse(users, "Users fetched successfully"));
});

// GET /api/users/me/stats
export const getMyStats = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId } = req.user!;

  if (!teamId) {
    throw new ApiError("You are not part of any team", 403);
  }

  // Scope strictly to the user's current team — excludes issues from past teams
  const assigned = await Issue.find({ assignedTo: userId, teamId })
    .populate("createdBy", "name email")
    .sort({ updatedAt: -1 })
    .lean();

  const now = new Date();
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  let overdue = 0;

  for (const issue of assigned) {
    if (issue.status === "TODO") todo++;
    else if (issue.status === "IN_PROGRESS") inProgress++;
    else done++;

    if (
      issue.status !== "DONE" &&
      issue.dueDate &&
      new Date(issue.dueDate) < now
    ) {
      overdue++;
    }
  }

  const total = assigned.length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  res.json(
    new ApiResponse(
      {
        total,
        todo,
        inProgress,
        done,
        overdue,
        completionRate,
        issues: assigned,
      },
      "Profile stats fetched successfully"
    )
  );
});
