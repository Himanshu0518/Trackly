import { IApiError } from "../types/index.js";

class ApiError extends Error implements IApiError {
  statusCode: number;
  errors: string[];
  success: false = false;
  data: null = null;

  constructor(
    message: string = "Something went wrong",
    statusCode: number = 500,
    errors: string[] = [],
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
