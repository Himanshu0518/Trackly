import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/api-error.js";

/**
 * Must be used after verifyJWT.
 * Blocks the request if the authenticated user is not an ADMIN.
 */
export const verifyAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "ADMIN") {
    return next(new ApiError("Forbidden — admin access required", 403));
  }
  next();
};
