import { Request, Response, NextFunction } from "express";
import ApiError from "./api-error.js";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch((error: unknown) => {
      // If it's already one of our typed errors, pass it straight to Express
      if (error instanceof ApiError) {
        next(error);
        return;
      }

      // Wrap unexpected errors so the error middleware always gets an ApiError
      const wrapped = new ApiError(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      );
      next(wrapped);
    });
  };
};

export default asyncHandler ;