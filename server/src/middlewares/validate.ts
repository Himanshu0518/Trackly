import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import ApiError from "@/utils/api-error.js";

/**
 * Generic Zod validation middleware.
 * Pass a schema that validates { body, params, query } — only
 * declare the fields you care about; the rest are ignored.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.slice(1).join(".")}: ${issue.message}`
      );
      return next(new ApiError("Validation failed", 422, errors));
    }

    // Overwrite with the parsed (coerced / transformed) values
    const parsed = result.data as { body?: unknown };
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    next();
  };
