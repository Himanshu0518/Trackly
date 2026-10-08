import { IApiResponse } from "@/types/index.js";

class ApiResponse<T = unknown> implements IApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data: T;

  constructor(data: T, message: string = "Success", statusCode: number = 200) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
