import { BadRequestError } from "../../core/ApiError";
import { ProjectStatus, MilestoneStatus, TaskStatus, TaskPriority } from "../../generated/prisma/enums";

export interface CreateProjectDto {
  name: string;
  description?: string;
  category?: string;
  targetDate?: Date;
  nextAction?: string;
  status?: ProjectStatus;
  goalId?: string;
  subjectId?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string | null;
  category?: string | null;
  targetDate?: Date | null;
  nextAction?: string | null;
  status?: ProjectStatus;
  goalId?: string | null;
  subjectId?: string | null;
}

export interface CreateProjectMilestoneDto {
  title: string;
  description?: string;
  targetDate?: Date;
  status?: MilestoneStatus;
  sortOrder?: number;
}

export interface UpdateProjectMilestoneDto {
  title?: string;
  description?: string | null;
  targetDate?: Date | null;
  status?: MilestoneStatus;
  sortOrder?: number;
}

export interface CreateProjectTaskDto {
  title: string;
  description?: string;
  milestoneId?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  estimateMinutes?: number;
  status?: TaskStatus;
}

export interface UpdateProjectTaskDto {
  title?: string;
  description?: string | null;
  milestoneId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  estimateMinutes?: number | null;
}

export interface CreateProjectWorkSessionDto {
  summary: string;
  durationMinutes: number;
  occurredAt?: Date;
  outcome?: string;
  blocker?: string;
  nextStep?: string;
  milestoneId?: string;
  taskId?: string;
}

export interface CreateProjectNoteDto {
  title: string;
  category?: string;
  content: string;
}

export interface UpdateProjectNoteDto {
  title?: string;
  category?: string | null;
  content?: string;
}

export function validateCreateProject(body: any): CreateProjectDto {
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw new BadRequestError("Project name is required");
  }

  let targetDate: Date | undefined;
  if (body.targetDate) {
    targetDate = new Date(body.targetDate);
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError("Invalid targetDate");
    }
  }

  return {
    name: body.name.trim(),
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    category: typeof body.category === "string" ? body.category.trim() : undefined,
    targetDate,
    nextAction: typeof body.nextAction === "string" ? body.nextAction.trim() : undefined,
    status: body.status,
    goalId: typeof body.goalId === "string" ? body.goalId : undefined,
    subjectId: typeof body.subjectId === "string" ? body.subjectId : undefined,
  };
}

export function validateUpdateProject(body: any): UpdateProjectDto {
  let targetDate: Date | null | undefined;
  if (body.targetDate !== undefined) {
    if (body.targetDate === null || body.targetDate === "") {
      targetDate = null;
    } else {
      targetDate = new Date(body.targetDate);
      if (isNaN(targetDate.getTime())) throw new BadRequestError("Invalid targetDate");
    }
  }

  return {
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
    description: body.description === null ? null : typeof body.description === "string" ? body.description.trim() : undefined,
    category: body.category === null ? null : typeof body.category === "string" ? body.category.trim() : undefined,
    targetDate,
    nextAction: body.nextAction === null ? null : typeof body.nextAction === "string" ? body.nextAction.trim() : undefined,
    status: body.status,
    goalId: body.goalId === null ? null : typeof body.goalId === "string" ? body.goalId : undefined,
    subjectId: body.subjectId === null ? null : typeof body.subjectId === "string" ? body.subjectId : undefined,
  };
}

export function validateCreateProjectMilestone(body: any): CreateProjectMilestoneDto {
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    throw new BadRequestError("Milestone title is required");
  }

  let targetDate: Date | undefined;
  if (body.targetDate) {
    targetDate = new Date(body.targetDate);
    if (isNaN(targetDate.getTime())) throw new BadRequestError("Invalid targetDate");
  }

  return {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    targetDate,
    status: body.status,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  };
}

export function validateUpdateProjectMilestone(body: any): UpdateProjectMilestoneDto {
  let targetDate: Date | null | undefined;
  if (body.targetDate !== undefined) {
    if (body.targetDate === null || body.targetDate === "") {
      targetDate = null;
    } else {
      targetDate = new Date(body.targetDate);
      if (isNaN(targetDate.getTime())) throw new BadRequestError("Invalid targetDate");
    }
  }

  return {
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined,
    description: body.description === null ? null : typeof body.description === "string" ? body.description.trim() : undefined,
    targetDate,
    status: body.status,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  };
}

export function validateCreateProjectTask(body: any): CreateProjectTaskDto {
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    throw new BadRequestError("Task title is required");
  }

  let dueDate: Date | undefined;
  if (body.dueDate) {
    dueDate = new Date(body.dueDate);
    if (isNaN(dueDate.getTime())) throw new BadRequestError("Invalid dueDate");
  }

  return {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    milestoneId: typeof body.milestoneId === "string" ? body.milestoneId : undefined,
    priority: body.priority,
    dueDate,
    estimateMinutes: typeof body.estimateMinutes === "number" ? body.estimateMinutes : undefined,
    status: body.status,
  };
}

export function validateUpdateProjectTask(body: any): UpdateProjectTaskDto {
  let dueDate: Date | null | undefined;
  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === "") {
      dueDate = null;
    } else {
      dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) throw new BadRequestError("Invalid dueDate");
    }
  }

  return {
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined,
    description: body.description === null ? null : typeof body.description === "string" ? body.description.trim() : undefined,
    milestoneId: body.milestoneId === null ? null : typeof body.milestoneId === "string" ? body.milestoneId : undefined,
    status: body.status,
    priority: body.priority,
    dueDate,
    estimateMinutes: body.estimateMinutes === null ? null : typeof body.estimateMinutes === "number" ? body.estimateMinutes : undefined,
  };
}

export function validateCreateProjectWorkSession(body: any): CreateProjectWorkSessionDto {
  if (!body.summary || typeof body.summary !== "string" || !body.summary.trim()) {
    throw new BadRequestError("Work session summary is required");
  }
  const durationMinutes = Number(body.durationMinutes);
  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    throw new BadRequestError("durationMinutes must be a positive number");
  }

  let occurredAt: Date | undefined;
  if (body.occurredAt) {
    occurredAt = new Date(body.occurredAt);
    if (isNaN(occurredAt.getTime())) throw new BadRequestError("Invalid occurredAt");
  }

  return {
    summary: body.summary.trim(),
    durationMinutes,
    occurredAt,
    outcome: typeof body.outcome === "string" ? body.outcome.trim() : undefined,
    blocker: typeof body.blocker === "string" ? body.blocker.trim() : undefined,
    nextStep: typeof body.nextStep === "string" ? body.nextStep.trim() : undefined,
    milestoneId: typeof body.milestoneId === "string" ? body.milestoneId : undefined,
    taskId: typeof body.taskId === "string" ? body.taskId : undefined,
  };
}

export function validateCreateProjectNote(body: any): CreateProjectNoteDto {
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    throw new BadRequestError("Note title is required");
  }
  if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
    throw new BadRequestError("Note content is required");
  }

  return {
    title: body.title.trim(),
    category: typeof body.category === "string" ? body.category.trim() : "General Note",
    content: body.content.trim(),
  };
}

export function validateUpdateProjectNote(body: any): UpdateProjectNoteDto {
  return {
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined,
    category: body.category === null ? null : typeof body.category === "string" ? body.category.trim() : undefined,
    content: typeof body.content === "string" && body.content.trim() ? body.content.trim() : undefined,
  };
}
