import { Response } from "express";
import {
  AuthFailure,
  IneternalErrorResponse,
  BadRequestResponse,
  NotFoundResponse,
  ForbiddenResponse,
} from "./ApiResponse";
export enum ErrorType {
  UNAUTHORIZED = "UnauthorizedError",
  FORBIDDEN = "ForbiddenError",
  NOT_FOUND = "NotFoundError",
  INTERNAL_SERVER_ERROR = "InternalServerError",
  BAD_REQUEST = "BadRequestError",
}

export abstract class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string = "error",
  ) {
    super(type);
  }

  public static handle(err: ApiError, res: Response): Response {
    switch (err.type) {
      case ErrorType.UNAUTHORIZED:
        return new AuthFailure(err.message).send(res);
      case ErrorType.INTERNAL_SERVER_ERROR:
        return new IneternalErrorResponse(err.message).send(res);
      case ErrorType.NOT_FOUND:
        return new NotFoundResponse(err.message).send(res);
      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);
      case ErrorType.FORBIDDEN:
        return new ForbiddenResponse(err.message).send(res);
      default: {
        let message = err.message;
        return new IneternalErrorResponse(message).send(res);
      }
    }
  }
}

export class AuthFailureError extends ApiError {
  constructor(message = "Invalid Credentials") {
    super(ErrorType.UNAUTHORIZED, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = "Internal error") {
    super(ErrorType.INTERNAL_SERVER_ERROR, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Permission denied") {
    super(ErrorType.FORBIDDEN, message);
  }
}
