import { Request, Response, NextFunction } from "express";
import { ApiError, InternalError } from "../core/ApiError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
    return;
  }

  console.error("Unhandled Error:", err);
  ApiError.handle(new InternalError(err.message || "An unexpected error occurred"), res);
}
