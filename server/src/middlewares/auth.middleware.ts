import { Request, Response, NextFunction } from "express";
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

    // Stamp the full payload — role + teamId are baked into the token
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      teamId: decoded.teamId,
    };

    next();
  }
);
