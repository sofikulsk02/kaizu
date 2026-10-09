import { BadRequestError } from "../../core/ApiError";
import { GoalStatus, MilestoneStatus, TaskStatus, TaskPriority } from "../../generated/prisma/enums";

export interface CreateGoalDto {
  title: string;
  description?: string;
  category?: string;
  successDefinition?: string;
  targetDate?: Date;
  status?: GoalStatus;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  category?: string | null;
  successDefinition?: string | null;
  targetDate?: Date | null;
  status?: GoalStatus;
}

export interface CreateMilestoneDto {
  title: string;
  description?: string;
  targetDate?: Date;
  status?: MilestoneStatus;
  sortOrder?: number;
}

export interface UpdateMilestoneDto {
  title?: string;
  description?: string | null;
  targetDate?: Date | null;
  status?: MilestoneStatus;
  sortOrder?: number;
}

export interface CreateGoalTaskDto {
  title: string;
  description?: string;
  milestoneId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  estimateMinutes?: number;
  sortOrder?: number;
}

export interface UpdateGoalTaskDto {
  title?: string;
  description?: string | null;
  milestoneId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  estimateMinutes?: number | null;
  sortOrder?: number;
}

export interface CreateDailyActionDto {
  summary: string;
  taskId?: string;
  milestoneId?: string;
  occurredAt?: Date;
  durationMinutes?: number;
  outcome?: string;
  blocker?: string;
  nextStep?: string;
  reflection?: {
    wentWell?: string;
    difficulty?: string;
    learning?: string;
    nextChange?: string;
  };
}

export interface CreateReflectionDto {
  dailyActionId?: string;
  wentWell?: string;
  difficulty?: string;
  learning?: string;
  nextChange?: string;
}

export function validateCreateGoal(body: any): CreateGoalDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description, category, successDefinition, targetDate, status } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new BadRequestError("Goal 'title' is required and must be a non-empty string");
  }

  let parsedTargetDate: Date | undefined = undefined;
  if (targetDate) {
    parsedTargetDate = new Date(targetDate);
    if (isNaN(parsedTargetDate.getTime())) {
      throw new BadRequestError("Invalid 'targetDate' format");
    }
  }

  let validStatus: GoalStatus | undefined = undefined;
  if (status) {
    if (!Object.values(GoalStatus).includes(status)) {
      throw new BadRequestError(`Invalid status '${status}'`);
    }
    validStatus = status as GoalStatus;
  }

  return {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
    category: typeof category === "string" ? category.trim() : undefined,
    successDefinition: typeof successDefinition === "string" ? successDefinition.trim() : undefined,
    targetDate: parsedTargetDate,
    status: validStatus,
  };
}

export function validateUpdateGoal(body: any): UpdateGoalDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description, category, successDefinition, targetDate, status } = body;
  const dto: UpdateGoalDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError("Goal 'title' must be a non-empty string");
    }
    dto.title = title.trim();
  }

  if (description !== undefined) {
    dto.description = typeof description === "string" ? description.trim() : undefined;
  }

  if (category !== undefined) {
    dto.category = typeof category === "string" && category.trim() ? category.trim() : null;
  }

  if (successDefinition !== undefined) {
    dto.successDefinition = typeof successDefinition === "string" && successDefinition.trim() ? successDefinition.trim() : null;
  }

  if (targetDate !== undefined) {
    if (targetDate === null || targetDate === "") {
      dto.targetDate = null;
    } else {
      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestError("Invalid 'targetDate' format");
      }
      dto.targetDate = parsed;
    }
  }

  if (status !== undefined) {
    if (!Object.values(GoalStatus).includes(status)) {
      throw new BadRequestError(`Invalid status '${status}'`);
    }
    dto.status = status as GoalStatus;
  }

  if (Object.keys(dto).length === 0) {
    throw new BadRequestError("At least one field must be provided to update goal");
  }

  return dto;
}

export function validateCreateMilestone(body: any): CreateMilestoneDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description, targetDate, status, sortOrder } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new BadRequestError("Milestone 'title' is required");
  }

  let parsedTargetDate: Date | undefined = undefined;
  if (targetDate) {
    parsedTargetDate = new Date(targetDate);
    if (isNaN(parsedTargetDate.getTime())) {
      throw new BadRequestError("Invalid 'targetDate' format");
    }
  }

  let validStatus: MilestoneStatus | undefined = undefined;
  if (status) {
    if (!Object.values(MilestoneStatus).includes(status)) {
      throw new BadRequestError(`Invalid milestone status '${status}'`);
    }
    validStatus = status as MilestoneStatus;
  }

  return {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
    targetDate: parsedTargetDate,
    status: validStatus,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
  };
}

export function validateUpdateMilestone(body: any): UpdateMilestoneDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description, targetDate, status, sortOrder } = body;
  const dto: UpdateMilestoneDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError("Milestone 'title' must be a non-empty string");
    }
    dto.title = title.trim();
  }

  if (description !== undefined) {
    dto.description = typeof description === "string" && description.trim() ? description.trim() : null;
  }

  if (targetDate !== undefined) {
    if (targetDate === null || targetDate === "") {
      dto.targetDate = null;
    } else {
      const parsed = new Date(targetDate);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestError("Invalid 'targetDate' format");
      }
      dto.targetDate = parsed;
    }
  }

  if (status !== undefined) {
    if (!Object.values(MilestoneStatus).includes(status)) {
      throw new BadRequestError(`Invalid milestone status '${status}'`);
    }
    dto.status = status as MilestoneStatus;
  }

  if (sortOrder !== undefined && typeof sortOrder === "number") {
    dto.sortOrder = sortOrder;
  }

  return dto;
}

export function validateCreateGoalTask(body: any): CreateGoalTaskDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description, milestoneId, status, priority, dueDate, estimateMinutes, sortOrder } = body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new BadRequestError("Task 'title' is required");
  }

  let parsedDueDate: Date | undefined = undefined;
  if (dueDate) {
    parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      throw new BadRequestError("Invalid 'dueDate' format");
    }
  }

  let validStatus: TaskStatus | undefined = undefined;
  if (status) {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestError(`Invalid task status '${status}'`);
    }
    validStatus = status as TaskStatus;
  }

  let validPriority: TaskPriority | undefined = undefined;
  if (priority) {
    if (!Object.values(TaskPriority).includes(priority)) {
      throw new BadRequestError(`Invalid task priority '${priority}'`);
    }
    validPriority = priority as TaskPriority;
  }

  return {
    title: title.trim(),
    description: typeof description === "string" ? description.trim() : undefined,
    milestoneId: typeof milestoneId === "string" && milestoneId.trim() ? milestoneId.trim() : undefined,
    status: validStatus,
    priority: validPriority,
    dueDate: parsedDueDate,
    estimateMinutes: typeof estimateMinutes === "number" ? estimateMinutes : undefined,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
  };
}

export function validateUpdateGoalTask(body: any): UpdateGoalTaskDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { title, description, milestoneId, status, priority, dueDate, estimateMinutes, sortOrder } = body;
  const dto: UpdateGoalTaskDto = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new BadRequestError("Task 'title' must be a non-empty string");
    }
    dto.title = title.trim();
  }

  if (description !== undefined) {
    dto.description = typeof description === "string" && description.trim() ? description.trim() : null;
  }

  if (milestoneId !== undefined) {
    dto.milestoneId = typeof milestoneId === "string" && milestoneId.trim() ? milestoneId.trim() : null;
  }

  if (status !== undefined) {
    if (!Object.values(TaskStatus).includes(status)) {
      throw new BadRequestError(`Invalid task status '${status}'`);
    }
    dto.status = status as TaskStatus;
  }

  if (priority !== undefined) {
    if (!Object.values(TaskPriority).includes(priority)) {
      throw new BadRequestError(`Invalid task priority '${priority}'`);
    }
    dto.priority = priority as TaskPriority;
  }

  if (dueDate !== undefined) {
    if (dueDate === null || dueDate === "") {
      dto.dueDate = null;
    } else {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestError("Invalid 'dueDate' format");
      }
      dto.dueDate = parsed;
    }
  }

  if (estimateMinutes !== undefined) {
    dto.estimateMinutes = typeof estimateMinutes === "number" ? estimateMinutes : null;
  }

  if (sortOrder !== undefined && typeof sortOrder === "number") {
    dto.sortOrder = sortOrder;
  }

  return dto;
}

export function validateCreateDailyAction(body: any): CreateDailyActionDto {
  if (!body || typeof body !== "object") {
    throw new BadRequestError("Request body must be a valid JSON object");
  }

  const { summary, taskId, milestoneId, occurredAt, durationMinutes, outcome, blocker, nextStep, reflection } = body;

  if (!summary || typeof summary !== "string" || summary.trim() === "") {
    throw new BadRequestError("Daily action 'summary' (What did you work on?) is required");
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
    taskId: typeof taskId === "string" && taskId.trim() ? taskId.trim() : undefined,
    milestoneId: typeof milestoneId === "string" && milestoneId.trim() ? milestoneId.trim() : undefined,
    occurredAt: parsedOccurredAt,
    durationMinutes: typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : undefined,
    outcome: typeof outcome === "string" ? outcome.trim() : undefined,
    blocker: typeof blocker === "string" ? blocker.trim() : undefined,
    nextStep: typeof nextStep === "string" ? nextStep.trim() : undefined,
    reflection: reflection && typeof reflection === "object" ? {
      wentWell: typeof reflection.wentWell === "string" ? reflection.wentWell.trim() : undefined,
      difficulty: typeof reflection.difficulty === "string" ? reflection.difficulty.trim() : undefined,
      learning: typeof reflection.learning === "string" ? reflection.learning.trim() : undefined,
      nextChange: typeof reflection.nextChange === "string" ? reflection.nextChange.trim() : undefined,
    } : undefined,
  };
}
