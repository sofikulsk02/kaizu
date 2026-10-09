import { prisma } from "../../database/prisma";
import { NotFoundError, ForbiddenError } from "../../core/ApiError";
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateProjectMilestoneDto,
  UpdateProjectMilestoneDto,
  CreateProjectTaskDto,
  UpdateProjectTaskDto,
  CreateProjectWorkSessionDto,
  CreateProjectNoteDto,
  UpdateProjectNoteDto,
} from "./project.schema";
import { ProjectStatus } from "../../generated/prisma/enums";

export class ProjectService {
  // Get all projects for user with summary metrics
  public static async getProjects(userId: string, status?: ProjectStatus) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        milestones: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, status: true },
        },
        tasks: {
          select: { id: true, status: true },
        },
        workSessions: {
          select: { durationMinutes: true, occurredAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects.map((project: any) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t: any) => t.status === "COMPLETED").length;
      const totalEffortMinutes = project.workSessions.reduce((acc: number, s: any) => acc + s.durationMinutes, 0);
      const currentMilestone = project.milestones.find((m: any) => m.status === "IN_PROGRESS") || project.milestones[0];

      return {
        id: project.id,
        userId: project.userId,
        goalId: project.goalId,
        subjectId: project.subjectId,
        name: project.name,
        description: project.description,
        category: project.category,
        status: project.status,
        targetDate: project.targetDate,
        nextAction: project.nextAction,
        completedAt: project.completedAt,
        milestoneCount: project.milestones.length,
        currentMilestoneTitle: currentMilestone ? currentMilestone.title : null,
        totalTasksCount: totalTasks,
        completedTasksCount: completedTasks,
        totalEffortMinutes,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });
  }

  // Get project by ID with full detail and computed metrics
  public static async getProjectById(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: {
          orderBy: { sortOrder: "asc" },
          include: {
            tasks: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        tasks: {
          where: { milestoneId: null },
          orderBy: { sortOrder: "asc" },
        },
        workSessions: {
          orderBy: { occurredAt: "desc" },
          include: {
            milestone: { select: { id: true, title: true } },
            task: { select: { id: true, title: true } },
          },
        },
        notes: {
          orderBy: { updatedAt: "desc" },
        },
        goal: { select: { id: true, title: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenError("You do not have permission to access this project");
    }

    // Compute metrics
    const allTasks = [
      ...project.tasks,
      ...project.milestones.flatMap((m: any) => m.tasks),
    ];
    const completedTasksCount = allTasks.filter((t: any) => t.status === "COMPLETED").length;
    const totalTasksCount = allTasks.length;
    const taskProgressPercentage =
      totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : null;

    const completedMilestonesCount = project.milestones.filter((m: any) => m.status === "COMPLETED").length;
    const totalMilestonesCount = project.milestones.length;

    const totalEffortMinutes = project.workSessions.reduce((acc: number, s: any) => acc + s.durationMinutes, 0);

    const activeDaysSet = new Set(
      project.workSessions.map((s: any) => new Date(s.occurredAt).toISOString().split("T")[0])
    );
    const activeDaysCount = activeDaysSet.size;

    const currentMilestone = project.milestones.find((m: any) => m.status === "IN_PROGRESS") || project.milestones[0] || null;

    return {
      ...project,
      directTasks: project.tasks,
      metrics: {
        completedTasksCount,
        totalTasksCount,
        taskProgressPercentage,
        completedMilestonesCount,
        totalMilestonesCount,
        totalEffortMinutes,
        activeDaysCount,
      },
      currentMilestone: currentMilestone
        ? { id: currentMilestone.id, title: currentMilestone.title, status: currentMilestone.status }
        : null,
    };
  }

  // Create Project
  public static async createProject(userId: string, dto: CreateProjectDto) {
    return prisma.project.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        targetDate: dto.targetDate,
        nextAction: dto.nextAction,
        status: dto.status || ("IN_PROGRESS" as ProjectStatus),
        goalId: dto.goalId || undefined,
        subjectId: dto.subjectId || undefined,
      },
    });
  }

  // Update Project
  public static async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundError("Project not found");
    if (existing.userId !== userId) throw new ForbiddenError("Forbidden");

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.targetDate !== undefined) data.targetDate = dto.targetDate;
    if (dto.nextAction !== undefined) data.nextAction = dto.nextAction;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "COMPLETED" && existing.status !== "COMPLETED") {
        data.completedAt = new Date();
      } else if (dto.status !== "COMPLETED") {
        data.completedAt = null;
      }
    }
    if (dto.goalId !== undefined) data.goalId = dto.goalId;
    if (dto.subjectId !== undefined) data.subjectId = dto.subjectId;

    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  // Delete Project
  public static async deleteProject(userId: string, projectId: string) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new NotFoundError("Project not found");
    if (existing.userId !== userId) throw new ForbiddenError("Forbidden");

    return prisma.project.delete({ where: { id: projectId } });
  }

  // --- Milestones ---
  public static async createMilestone(userId: string, projectId: string, dto: CreateProjectMilestoneDto) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Project not found");
    if (project.userId !== userId) throw new ForbiddenError("Forbidden");

    return prisma.projectMilestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        targetDate: dto.targetDate,
        status: dto.status || "UPCOMING",
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  public static async updateMilestone(
    userId: string,
    projectId: string,
    milestoneId: string,
    dto: UpdateProjectMilestoneDto
  ) {
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone || milestone.projectId !== projectId) {
      throw new NotFoundError("Milestone not found");
    }
    if (milestone.project.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.targetDate !== undefined) data.targetDate = dto.targetDate;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return prisma.projectMilestone.update({
      where: { id: milestoneId },
      data,
    });
  }

  public static async deleteMilestone(userId: string, projectId: string, milestoneId: string) {
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone || milestone.projectId !== projectId) {
      throw new NotFoundError("Milestone not found");
    }
    if (milestone.project.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    return prisma.projectMilestone.delete({ where: { id: milestoneId } });
  }

  // --- Tasks ---
  public static async createTask(userId: string, projectId: string, dto: CreateProjectTaskDto) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Project not found");
    if (project.userId !== userId) throw new ForbiddenError("Forbidden");

    return prisma.projectTask.create({
      data: {
        projectId,
        milestoneId: dto.milestoneId || undefined,
        title: dto.title,
        description: dto.description,
        status: dto.status || "TODO",
        priority: dto.priority || "MEDIUM",
        dueDate: dto.dueDate,
        estimateMinutes: dto.estimateMinutes || undefined,
      },
    });
  }

  public static async updateTask(
    userId: string,
    projectId: string,
    taskId: string,
    dto: UpdateProjectTaskDto
  ) {
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.projectId !== projectId) {
      throw new NotFoundError("Task not found");
    }
    if (task.project.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.milestoneId !== undefined) data.milestoneId = dto.milestoneId;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate;
    if (dto.estimateMinutes !== undefined) data.estimateMinutes = dto.estimateMinutes;

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "COMPLETED" && task.status !== "COMPLETED") {
        data.completedAt = new Date();
      } else if (dto.status !== "COMPLETED") {
        data.completedAt = null;
      }
    }

    return prisma.projectTask.update({
      where: { id: taskId },
      data,
    });
  }

  public static async deleteTask(userId: string, projectId: string, taskId: string) {
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.projectId !== projectId) {
      throw new NotFoundError("Task not found");
    }
    if (task.project.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    return prisma.projectTask.delete({ where: { id: taskId } });
  }

  // --- Work Sessions ---
  public static async createWorkSession(userId: string, projectId: string, dto: CreateProjectWorkSessionDto) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Project not found");
    if (project.userId !== userId) throw new ForbiddenError("Forbidden");

    // Auto-update project's next action if provided in the session!
    if (dto.nextStep && dto.nextStep.trim()) {
      await prisma.project.update({
        where: { id: projectId },
        data: { nextAction: dto.nextStep.trim() },
      });
    }

    return prisma.projectWorkSession.create({
      data: {
        userId,
        projectId,
        milestoneId: dto.milestoneId || undefined,
        taskId: dto.taskId || undefined,
        summary: dto.summary,
        durationMinutes: dto.durationMinutes,
        occurredAt: dto.occurredAt || undefined,
        outcome: dto.outcome,
        blocker: dto.blocker,
        nextStep: dto.nextStep,
      },
      include: {
        milestone: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  public static async deleteWorkSession(userId: string, projectId: string, sessionId: string) {
    const session = await prisma.projectWorkSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.projectId !== projectId) {
      throw new NotFoundError("Work session not found");
    }
    if (session.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    return prisma.projectWorkSession.delete({ where: { id: sessionId } });
  }

  // --- Notes & Decisions ---
  public static async createNote(userId: string, projectId: string, dto: CreateProjectNoteDto) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError("Project not found");
    if (project.userId !== userId) throw new ForbiddenError("Forbidden");

    return prisma.projectNote.create({
      data: {
        projectId,
        title: dto.title,
        category: dto.category || "General Note",
        content: dto.content,
      },
    });
  }

  public static async updateNote(userId: string, projectId: string, noteId: string, dto: UpdateProjectNoteDto) {
    const note = await prisma.projectNote.findUnique({
      where: { id: noteId },
      include: { project: true },
    });

    if (!note || note.projectId !== projectId) {
      throw new NotFoundError("Note not found");
    }
    if (note.project.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.content !== undefined) data.content = dto.content;

    return prisma.projectNote.update({
      where: { id: noteId },
      data,
    });
  }

  public static async deleteNote(userId: string, projectId: string, noteId: string) {
    const note = await prisma.projectNote.findUnique({
      where: { id: noteId },
      include: { project: true },
    });

    if (!note || note.projectId !== projectId) {
      throw new NotFoundError("Note not found");
    }
    if (note.project.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    return prisma.projectNote.delete({ where: { id: noteId } });
  }
}
