import { Request, Response } from "express";
import { Types } from "mongoose";
import { Team, User } from "@/models/index.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { createAuthToken } from "@/utils/user-utils.js";
import { accessTokenCookieOptions } from "@/utils/cookie-options.js";
import ApiError from "@/utils/api-error.js";
import ApiResponse from "@/utils/api-response.js";
import {
  CreateTeamBody,
  UpdateTeamBody,
  AddMemberBody,
} from "@/validators/team.validator.js";

const toObjectId = (id: string) => new Types.ObjectId(id);

// POST /api/teams
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as CreateTeamBody;
  const userId = req.user!.userId;

  const caller = await User.findById(userId);
  if (!caller) throw new ApiError("User not found", 404);
  if (caller.teamId) throw new ApiError("You already belong to a team", 409);

  const team = await Team.create({ name, description, createdBy: userId });

  caller.role = "ADMIN";
  caller.teamId = team._id as unknown as typeof caller.teamId;
  await caller.save();

  const token = createAuthToken(userId, "ADMIN", team._id.toString());

  res
    .status(201)
    .cookie("accessToken", token, accessTokenCookieOptions)
    .json(new ApiResponse({ team, token }, "Team created successfully", 201));
});

// GET /api/teams/my
export const getMyTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 404);

  const team = await Team.findById(teamId);
  if (!team) throw new ApiError("Team not found", 404);

  res.json(new ApiResponse(team, "Team fetched successfully"));
});

// GET /api/teams/my/members
export const getTeamMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 404);

    const members = await User.find({ teamId }).select("-passwordHash");

    res.json(new ApiResponse(members, "Members fetched successfully"));
  }
);

// PATCH /api/teams/my  (ADMIN only)
export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as UpdateTeamBody;
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 404);

  const team = await Team.findByIdAndUpdate(
    teamId,
    {
      ...(name && { name }),
      ...(description !== undefined && { description }),
    },
    { new: true, runValidators: true }
  );
  if (!team) throw new ApiError("Team not found", 404);

  res.json(new ApiResponse(team, "Team updated successfully"));
});

// DELETE /api/teams/my  (ADMIN only)
export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, userId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 404);

  await Team.findByIdAndDelete(teamId);
  await User.updateMany({ teamId }, { $set: { teamId: null, role: "MEMBER" } });

  const token = createAuthToken(userId, "MEMBER", null);

  res
    .cookie("accessToken", token, accessTokenCookieOptions)
    .json(new ApiResponse({ token }, "Team deleted successfully"));
});

// POST /api/teams/my/members  (ADMIN only)
export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { userId: targetUserId } = req.body as AddMemberBody;
  const { teamId } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 404);

  const target = await User.findById(targetUserId);
  if (!target) throw new ApiError("User not found", 404);
  if (target.teamId) throw new ApiError("User already belongs to a team", 409);

  target.teamId = toObjectId(teamId) as unknown as typeof target.teamId;
  await target.save();

  res.json(
    new ApiResponse(
      { id: target._id, name: target.name, email: target.email, role: target.role },
      "Member added successfully"
    )
  );
});

// DELETE /api/teams/my/members/:memberId  (ADMIN only)
export const removeMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { memberId } = req.params;
    const { teamId, userId: adminId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 404);

    if (memberId === adminId) {
      throw new ApiError(
        "Admin cannot remove themselves — delete the team instead",
        400
      );
    }

    const target = await User.findOne({ _id: memberId, teamId });
    if (!target) throw new ApiError("Member not found in your team", 404);

    target.teamId = null;
    target.role = "MEMBER";
    await target.save();

    res.json(new ApiResponse(null, "Member removed successfully"));
  }
);

// POST /api/teams/my/exit  (MEMBER only — admin must delete the team instead)
export const exitTeam = asyncHandler(async (req: Request, res: Response) => {
  const { userId, teamId, role } = req.user!;
  if (!teamId) throw new ApiError("You are not part of any team", 400);

  if (role === "ADMIN") {
    throw new ApiError(
      "Admins cannot leave — transfer ownership or delete the team first",
      403
    );
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError("User not found", 404);

  user.teamId = null;
  user.role = "MEMBER";
  await user.save();

  // Re-issue token with cleared teamId so the client reflects the change immediately
  const token = createAuthToken(userId, "MEMBER", null);

  res
    .cookie("accessToken", token, accessTokenCookieOptions)
    .json(new ApiResponse({ token }, "You have left the team"));
});
