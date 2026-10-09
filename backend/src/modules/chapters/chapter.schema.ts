import { BadRequestError } from "../../core/ApiError";

export interface CreateChapterDto {
  title: string;
  description?: string;
}

export interface UpdateChapterDto {
  title?: string;
  description?: string;
}

export function validateCreateChapter(body: any): CreateChapterDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new BadRequestError("Chapter 'title' is required and must be a non-empty string");
  }

  return {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
  };
}

export function validateUpdateChapter(body: any): UpdateChapterDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description } = body;
  const dto: UpdateChapterDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError("Chapter 'title' must be a non-empty string");
    }
    dto.title = title.trim();
  }

  if (description !== undefined) {
    dto.description = typeof description === "string" ? description.trim() : undefined;
  }

  if (Object.keys(dto).length === 0) {
    throw new BadRequestError("At least one field ('title' or 'description') must be provided to update");
  }

  return dto;
}
