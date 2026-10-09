import { BadRequestError } from "../../core/ApiError";
import { TopicStatus } from "../../generated/prisma/enums";

export interface CreateTopicDto {
  title: string;
  status?: TopicStatus;
  confidence?: number;
  notes?: string;
  resources?: string;
  nextStep?: string;
  revisionDate?: Date;
}

export interface UpdateTopicDto {
  title?: string;
  status?: TopicStatus;
  confidence?: number | null;
  notes?: string | null;
  resources?: string | null;
  nextStep?: string | null;
  revisionDate?: Date | null;
}

export function validateCreateTopic(body: any): CreateTopicDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, status, confidence, notes, resources, nextStep, revisionDate } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new BadRequestError("Topic 'title' is required and must be a non-empty string");
  }

  let validStatus: TopicStatus | undefined = undefined;
  if (status) {
    if (!Object.values(TopicStatus).includes(status)) {
      throw new BadRequestError(`Invalid topic status '${status}'`);
    }
    validStatus = status as TopicStatus;
  }

  let parsedRevDate: Date | undefined = undefined;
  if (revisionDate) {
    parsedRevDate = new Date(revisionDate);
    if (isNaN(parsedRevDate.getTime())) {
      throw new BadRequestError("Invalid 'revisionDate' format");
    }
  }

  return {
    title: title.trim(),
    status: validStatus,
    confidence: typeof confidence === "number" ? Math.min(5, Math.max(1, confidence)) : undefined,
    notes: typeof notes === "string" ? notes.trim() : undefined,
    resources: typeof resources === "string" ? resources.trim() : undefined,
    nextStep: typeof nextStep === "string" ? nextStep.trim() : undefined,
    revisionDate: parsedRevDate,
  };
}

export function validateUpdateTopic(body: any): UpdateTopicDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, status, confidence, notes, resources, nextStep, revisionDate } = body;
  const dto: UpdateTopicDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError("Topic 'title' must be a non-empty string");
    }
    dto.title = title.trim();
  }

  if (status !== undefined) {
    if (!Object.values(TopicStatus).includes(status)) {
      throw new BadRequestError(`Invalid topic status '${status}'`);
    }
    dto.status = status as TopicStatus;
  }

  if (confidence !== undefined) {
    dto.confidence = typeof confidence === "number" ? Math.min(5, Math.max(1, confidence)) : null;
  }

  if (notes !== undefined) {
    dto.notes = typeof notes === "string" && notes.trim() ? notes.trim() : null;
  }

  if (resources !== undefined) {
    dto.resources = typeof resources === "string" && resources.trim() ? resources.trim() : null;
  }

  if (nextStep !== undefined) {
    dto.nextStep = typeof nextStep === "string" && nextStep.trim() ? nextStep.trim() : null;
  }

  if (revisionDate !== undefined) {
    if (revisionDate === null || revisionDate === "") {
      dto.revisionDate = null;
    } else {
      const parsed = new Date(revisionDate);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestError("Invalid 'revisionDate' format");
      }
      dto.revisionDate = parsed;
    }
  }

  return dto;
}
