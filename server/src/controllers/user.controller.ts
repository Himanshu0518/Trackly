import { Request, Response } from "express";
import { User } from "@/models/index.js";
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
