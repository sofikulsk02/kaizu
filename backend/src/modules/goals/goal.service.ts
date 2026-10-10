import { prisma } from "../../database/prisma";
import { NotFoundError, BadRequestError } from "../../core/ApiError";
import { CacheService } from "../../core/cache.service";
import {
  CreateGoalDto,
  UpdateGoalDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateGoalTaskDto,
  UpdateGoalTaskDto,
  CreateDailyActionDto,
} from "./goal.schema";
import { GoalStatus, MilestoneStatus, TaskStatus } from "../../generated/prisma/enums";

export class GoalService {
  public static async createGoal(userId: string, dto: CreateGoalDto) {
    const isCompleted = dto.status === GoalStatus.COMPLETED;

    const created = await prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        successDefinition: dto.successDefinition,
        targetDate: dto.targetDate,
        status: dto.status || GoalStatus.ACTIVE,
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        milestones: true,
        tasks: true,
      },
    });

    await CacheService.invalidateUserGoals(userId);
    return created;
  }

  public static async getGoals(userId: string, statusFilter?: GoalStatus) {
    const cacheKey = `kaizu:user:${userId}:goals:${statusFilter || "all"}`;

    return CacheService.fetchOrSet(
      cacheKey,
      async () => {
        const goals = await prisma.goal.findMany({
          where: {
            userId,
            ...(statusFilter ? { status: statusFilter } : {}),
          },
          include: {
            milestones: {
              select: { id: true, status: true },
            },
            tasks: {
              select: { id: true, status: true },
            },
            _count: {
              select: {
                milestones: true,
                tasks: true,
                dailyActions: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return goals.map((g) => {
          const completedTasks = g.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
          const totalTasks = g.tasks.length;
          const completedMilestones = g.milestones.filter((m) => m.status === MilestoneStatus.COMPLETED).length;
          const totalMilestones = g.milestones.length;

          return {
            ...g,
            completedTasksCount: completedTasks,
            totalTasksCount: totalTasks,
            completedMilestonesCount: completedMilestones,
            totalMilestonesCount: totalMilestones,
          };
        });
      },
      300
    );
  }

  public static async getGoalById(userId: string, id: string) {
    const cacheKey = `kaizu:user:${userId}:goals:${id}`;

    return CacheService.fetchOrSet(
      cacheKey,
      async () => {
        const goal = await prisma.goal.findFirst({
          where: { id, userId },
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
              orderBy: { sortOrder: "asc" },
            },
            dailyActions: {
              orderBy: { occurredAt: "desc" },
              include: {
                task: { select: { id: true, title: true } },
                milestone: { select: { id: true, title: true } },
                reflections: true,
              },
            },
            reflections: {
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!goal) {
          throw new NotFoundError("Goal not found");
        }

        // Separate tasks directly under goal vs under milestones
        const directTasks = goal.tasks.filter((t) => !t.milestoneId);
        const allTasks = goal.tasks;
        const completedTasks = allTasks.filter((t) => t.status === TaskStatus.COMPLETED);
        const completedMilestones = goal.milestones.filter((m) => m.status === MilestoneStatus.COMPLETED);

        // Effort & Consistency
        const totalDurationMinutes = goal.dailyActions.reduce(
          (acc, act) => acc + (act.durationMinutes || 0),
          0
        );

        const activeDaysSet = new Set(
          goal.dailyActions.map((act) => new Date(act.occurredAt).toISOString().split("T")[0])
        );
        const activeDaysCount = activeDaysSet.size;

        // Determine Today's Focus task recommendation (first high-priority unfinished task or next incomplete task)
        const unfinishedTasks = allTasks.filter((t) => t.status !== TaskStatus.COMPLETED);
        let todaysFocusTask = unfinishedTasks.find((t) => t.priority === "HIGH") || unfinishedTasks[0] || null;

        return {
          ...goal,
          directTasks,
          metrics: {
            completedTasksCount: completedTasks.length,
            totalTasksCount: allTasks.length,
            taskProgressPercentage: allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : null,
            completedMilestonesCount: completedMilestones.length,
            totalMilestonesCount: goal.milestones.length,
            milestoneProgressPercentage: goal.milestones.length > 0 ? Math.round((completedMilestones.length / goal.milestones.length) * 100) : null,
            totalDurationMinutes,
            activeDaysCount,
          },
          todaysFocusTask,
        };
      },
      300
    );
  }

  public static async updateGoal(userId: string, id: string, dto: UpdateGoalDto) {
    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError("Goal not found");
    }

    let completedAt = existing.completedAt;
    if (dto.status !== undefined) {
      if (dto.status === GoalStatus.COMPLETED && existing.status !== GoalStatus.COMPLETED) {
        completedAt = new Date();
      } else if (dto.status !== GoalStatus.COMPLETED) {
        completedAt = null;
      }
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.successDefinition !== undefined && { successDefinition: dto.successDefinition }),
        ...(dto.targetDate !== undefined && { targetDate: dto.targetDate }),
        ...(dto.status !== undefined && { status: dto.status }),
        completedAt,
      },
    });

    await CacheService.invalidateUserGoals(userId);
    return updated;
  }

  public static async deleteGoal(userId: string, id: string) {
    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError("Goal not found");
    }

    await prisma.goal.delete({
      where: { id },
    });

    await CacheService.invalidateUserGoals(userId);
    return { success: true, message: "Goal deleted successfully" };
  }

  // =========================================================================
  // Milestone Operations
  // =========================================================================

  public static async createMilestone(userId: string, goalId: string, dto: CreateMilestoneDto) {
    await this.getGoalById(userId, goalId);

    const created = await prisma.milestone.create({
      data: {
        goalId,
        title: dto.title,
        description: dto.description,
        targetDate: dto.targetDate,
        status: dto.status || MilestoneStatus.UPCOMING,
        sortOrder: dto.sortOrder || 0,
      },
    });

    await CacheService.invalidateUserGoals(userId);
    return created;
  }

  public static async updateMilestone(
    userId: string,
    goalId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto
  ) {
    await this.getGoalById(userId, goalId);

    const existing = await prisma.milestone.findFirst({
      where: { id: milestoneId, goalId },
    });

    if (!existing) {
      throw new NotFoundError("Milestone not found for this goal");
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.targetDate !== undefined && { targetDate: dto.targetDate }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    await CacheService.invalidateUserGoals(userId);
    return updated;
  }

  public static async deleteMilestone(userId: string, goalId: string, milestoneId: string) {
    await this.getGoalById(userId, goalId);

    const existing = await prisma.milestone.findFirst({
      where: { id: milestoneId, goalId },
    });

    if (!existing) {
      throw new NotFoundError("Milestone not found for this goal");
    }

    await prisma.milestone.delete({
      where: { id: milestoneId },
    });

    await CacheService.invalidateUserGoals(userId);
    return { success: true };
  }

  // =========================================================================
  // Task Operations
  // =========================================================================

  public static async createTask(userId: string, goalId: string, dto: CreateGoalTaskDto) {
    await this.getGoalById(userId, goalId);

    if (dto.milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: { id: dto.milestoneId, goalId },
      });
      if (!milestone) {
        throw new BadRequestError("Referenced milestone does not belong to this goal");
      }
    }

    const isCompleted = dto.status === TaskStatus.COMPLETED;

    const created = await prisma.goalTask.create({
      data: {
        goalId,
        milestoneId: dto.milestoneId || null,
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority || "MEDIUM",
        dueDate: dto.dueDate,
        estimateMinutes: dto.estimateMinutes,
        sortOrder: dto.sortOrder || 0,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    await CacheService.invalidateUserGoals(userId);
    return created;
  }

  public static async updateTask(
    userId: string,
    goalId: string,
    taskId: string,
    dto: UpdateGoalTaskDto
  ) {
    await this.getGoalById(userId, goalId);

    const existing = await prisma.goalTask.findFirst({
      where: { id: taskId, goalId },
    });

    if (!existing) {
      throw new NotFoundError("Task not found for this goal");
    }

    if (dto.milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: { id: dto.milestoneId, goalId },
      });
      if (!milestone) {
        throw new BadRequestError("Referenced milestone does not belong to this goal");
      }
    }

    let completedAt = existing.completedAt;
    if (dto.status !== undefined) {
      if (dto.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED) {
        completedAt = new Date();
      } else if (dto.status !== TaskStatus.COMPLETED) {
        completedAt = null;
      }
    }

    const updated = await prisma.goalTask.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.milestoneId !== undefined && { milestoneId: dto.milestoneId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.estimateMinutes !== undefined && { estimateMinutes: dto.estimateMinutes }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        completedAt,
      },
    });

    await CacheService.invalidateUserGoals(userId);
    return updated;
  }

  public static async deleteTask(userId: string, goalId: string, taskId: string) {
    await this.getGoalById(userId, goalId);

    const existing = await prisma.goalTask.findFirst({
      where: { id: taskId, goalId },
    });

    if (!existing) {
      throw new NotFoundError("Task not found for this goal");
    }

    await prisma.goalTask.delete({
      where: { id: taskId },
    });

    await CacheService.invalidateUserGoals(userId);
    return { success: true };
  }

  // =========================================================================
  // Daily Action & Reflection Operations
  // =========================================================================

  public static async createDailyAction(userId: string, goalId: string, dto: CreateDailyActionDto) {
    await this.getGoalById(userId, goalId);

    if (dto.taskId) {
      const task = await prisma.goalTask.findFirst({
        where: { id: dto.taskId, goalId },
      });
      if (!task) {
        throw new BadRequestError("Referenced task does not belong to this goal");
      }
    }

    if (dto.milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: { id: dto.milestoneId, goalId },
      });
      if (!milestone) {
        throw new BadRequestError("Referenced milestone does not belong to this goal");
      }
    }

    const action = await prisma.dailyAction.create({
      data: {
        goalId,
        taskId: dto.taskId || null,
        milestoneId: dto.milestoneId || null,
        summary: dto.summary,
        occurredAt: dto.occurredAt || new Date(),
        durationMinutes: dto.durationMinutes || null,
        outcome: dto.outcome || null,
        blocker: dto.blocker || null,
        nextStep: dto.nextStep || null,
      },
      include: {
        task: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    // If reflection details provided, attach reflection
    if (dto.reflection) {
      await prisma.reflection.create({
        data: {
          goalId,
          dailyActionId: action.id,
          wentWell: dto.reflection.wentWell || null,
          difficulty: dto.reflection.difficulty || null,
          learning: dto.reflection.learning || null,
          nextChange: dto.reflection.nextChange || null,
        },
      });
    }

    await CacheService.invalidateUserGoals(userId);
    return action;
  }

  public static async deleteDailyAction(userId: string, goalId: string, actionId: string) {
    await this.getGoalById(userId, goalId);

    const existing = await prisma.dailyAction.findFirst({
      where: { id: actionId, goalId },
    });

    if (!existing) {
      throw new NotFoundError("Daily action not found");
    }

    await prisma.dailyAction.delete({
      where: { id: actionId },
    });

    await CacheService.invalidateUserGoals(userId);
    return { success: true };
  }
}
