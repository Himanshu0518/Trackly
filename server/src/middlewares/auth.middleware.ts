import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { verifyAuthToken } from "@/utils/user-utils.js";
import { User } from "@/models/index.js";
import ApiError from "@/utils/api-error.js";

export const verifyJWT = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Accept token from cookie OR Authorization header
    const token: string | undefined =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError("Unauthorized — no token provided", 401);
    }

    // verifyAuthToken throws if the token is invalid/expired
    const decoded = verifyAuthToken(token);

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      throw new ApiError("Unauthorized — user not found", 401);
    }

    req.user = { userId: user._id.toString() };
    next();
  }
);
