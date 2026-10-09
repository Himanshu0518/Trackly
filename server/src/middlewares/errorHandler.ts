import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-error.js";

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    errors: err.errors ?? [],
    data: null,
  });
};
