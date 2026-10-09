import { Request, Response, NextFunction } from "express";
import { User } from "@/models/index.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { verifyAuthToken } from "@/utils/user-utils.js";
import ApiError from "@/utils/api-error.js";

export const verifyJWT = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token: string | undefined =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError("Unauthorized — no token provided", 401);
    }

    // verifyAuthToken throws if invalid/expired
    const decoded = verifyAuthToken(token);

    // The token only proves *who* the caller is. role + teamId can change after
    // the token was issued (added to / removed from a team, team deleted), so
    // read the live values instead of trusting the claims baked into the JWT.
    const user = await User.findById(decoded.userId).select("role teamId");
    if (!user) {
      throw new ApiError("Unauthorized — user no longer exists", 401);
    }

    req.user = {
      userId: decoded.userId,
      role: user.role,
      teamId: user.teamId ? user.teamId.toString() : null,
    };

    next();
  }
);
