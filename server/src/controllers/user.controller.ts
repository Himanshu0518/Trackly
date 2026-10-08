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
