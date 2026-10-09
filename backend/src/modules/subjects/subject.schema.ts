import { BadRequestError } from "../../core/ApiError";

export interface CreateSubjectDto {
  name: string;
  description?: string;
}

export interface UpdateSubjectDto {
  name?: string;
  description?: string;
}

export interface CreateStudySessionDto {
  summary: string;
  durationMinutes: number;
  occurredAt?: Date;
  chapterId?: string;
  topicId?: string;
  confidence?: number;
  outcome?: string;
  nextStep?: string;
}

export function validateCreateSubject(body: any): CreateSubjectDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { name, description } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new BadRequestError("Subject 'name' is required and must be a non-empty string");
  }

  return {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
  };
}

export function validateUpdateSubject(body: any): UpdateSubjectDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { name, description } = body;
  const dto: UpdateSubjectDto = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new BadRequestError("Subject 'name' must be a non-empty string");
    }
    dto.name = name.trim();
  }

  if (description !== undefined) {
    dto.description = typeof description === "string" ? description.trim() : undefined;
  }

  if (Object.keys(dto).length === 0) {
    throw new BadRequestError("At least one field ('name' or 'description') must be provided to update");
  }

  return dto;
}

export function validateCreateStudySession(body: any): CreateStudySessionDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { summary, durationMinutes, occurredAt, chapterId, topicId, confidence, outcome, nextStep } = body;

  if (!summary || typeof summary !== "string" || summary.trim() === "") {
    throw new BadRequestError("Study session 'summary' (What did you study?) is required");
  }

  if (typeof durationMinutes !== "number" || durationMinutes <= 0) {
    throw new BadRequestError("Study session 'durationMinutes' must be a positive number");
  }

  let parsedOccurredAt: Date | undefined = undefined;
  if (occurredAt) {
    parsedOccurredAt = new Date(occurredAt);
    if (isNaN(parsedOccurredAt.getTime())) {
      throw new BadRequestError("Invalid 'occurredAt' date format");
    }
  }

  return {
    summary: summary.trim(),
    durationMinutes: Math.round(durationMinutes),
    occurredAt: parsedOccurredAt,
    chapterId: typeof chapterId === "string" && chapterId.trim() ? chapterId.trim() : undefined,
    topicId: typeof topicId === "string" && topicId.trim() ? topicId.trim() : undefined,
    confidence: typeof confidence === "number" ? Math.min(5, Math.max(1, confidence)) : undefined,
    outcome: typeof outcome === "string" ? outcome.trim() : undefined,
    nextStep: typeof nextStep === "string" ? nextStep.trim() : undefined,
  };
}
