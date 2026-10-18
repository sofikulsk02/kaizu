import { BadRequestError } from "../../core/ApiError";

export interface CreateThoughtDto {
  title?: string | null;
  content: string;
  isPinned?: boolean;
}

export interface UpdateThoughtDto {
  title?: string | null;
  content?: string;
  isPinned?: boolean;
}

export function validateCreateThought(body: any): CreateThoughtDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Invalid request body");
  }

  const { title, content, isPinned } = body;

  if (typeof content !== "string" || !content.trim()) {
    throw new BadRequestError("Thought content is required and cannot be blank");
  }

  if (content.length > 20000) {
    throw new BadRequestError("Thought content cannot exceed 20,000 characters");
  }

  let sanitizedTitle: string | null = null;
  if (typeof title === "string") {
    const trimmed = title.trim();
    if (trimmed.length > 255) {
      throw new BadRequestError("Thought title cannot exceed 255 characters");
    }
    sanitizedTitle = trimmed.length > 0 ? trimmed : null;
  }

  return {
    title: sanitizedTitle,
    content: content.trim(),
    isPinned: typeof isPinned === "boolean" ? isPinned : false,
  };
}

export function validateUpdateThought(body: any): UpdateThoughtDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Invalid request body");
  }

  const { title, content, isPinned } = body;
  const dto: UpdateThoughtDto = {};

  if (content !== undefined) {
    if (typeof content !== "string" || !content.trim()) {
      throw new BadRequestError("Thought content cannot be empty");
    }
    if (content.length > 20000) {
      throw new BadRequestError("Thought content cannot exceed 20,000 characters");
    }
    dto.content = content.trim();
  }

  if (title !== undefined) {
    if (title === null) {
      dto.title = null;
    } else if (typeof title === "string") {
      const trimmed = title.trim();
      if (trimmed.length > 255) {
        throw new BadRequestError("Thought title cannot exceed 255 characters");
      }
      dto.title = trimmed.length > 0 ? trimmed : null;
    } else {
      throw new BadRequestError("Invalid title format");
    }
  }

  if (isPinned !== undefined) {
    if (typeof isPinned !== "boolean") {
      throw new BadRequestError("isPinned must be a boolean");
    }
    dto.isPinned = isPinned;
  }

  if (dto.content === undefined && dto.title === undefined && dto.isPinned === undefined) {
    throw new BadRequestError("At least one field (title, content, isPinned) must be provided for update");
  }

  return dto;
}
