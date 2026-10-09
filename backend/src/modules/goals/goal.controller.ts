import { Request, Response } from "express";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";
import { GoalService } from "./goal.service";
import { GoalCoachService } from "./coach.service";
import { QuickCaptureService } from "../quickCapture/quickCapture.service";
import {
  validateCreateGoal,
  validateUpdateGoal,
  validateCreateMilestone,
  validateUpdateMilestone,
  validateCreateGoalTask,
  validateUpdateGoalTask,
  validateCreateDailyAction,
} from "./goal.schema";
import { GoalStatus } from "../../generated/prisma/enums";

export class GoalController {
  // Goal CRUD
  public static async createGoal(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const dto = validateCreateGoal(req.body);
    const goal = await GoalService.createGoal(userId, dto);
    return new SuccessResponse("Goal created successfully", goal).send(res);
  }

  public static async getGoals(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const statusQuery = req.query.status as GoalStatus | undefined;
    const goals = await GoalService.getGoals(userId, statusQuery);
    return new SuccessResponse("Goals fetched successfully", goals).send(res);
  }

  public static async getGoalById(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const goal = await GoalService.getGoalById(userId, id);
    return new SuccessResponse("Goal details fetched successfully", goal).send(res);
  }

  public static async updateGoal(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = validateUpdateGoal(req.body);
    const goal = await GoalService.updateGoal(userId, id, dto);
    return new SuccessResponse("Goal updated successfully", goal).send(res);
  }

  public static async deleteGoal(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await GoalService.deleteGoal(userId, id);
    return new SuccessMsgResponse("Goal deleted successfully").send(res);
  }

  // Intelligent Goal Coach Endpoints
  public static async getCoachAnalysis(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const analysis = await GoalCoachService.getCoachAnalysis(userId, goalId);
    return new SuccessResponse("Goal Coach analysis generated successfully", analysis).send(res);
  }

  public static async generateGoalBreakdown(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const updatedGoal = await GoalCoachService.generateGoalBreakdown(userId, goalId);
    return new SuccessResponse("Goal plan breakdown generated successfully", updatedGoal).send(res);
  }

  // Quick Capture Endpoint
  public static async quickCapture(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const result = await QuickCaptureService.processCapture(userId, req.body);
    return new SuccessResponse("Quick capture processed successfully", result).send(res);
  }

  // Milestone Controllers
  public static async createMilestone(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const dto = validateCreateMilestone(req.body);
    const milestone = await GoalService.createMilestone(userId, goalId, dto);
    return new SuccessResponse("Milestone created successfully", milestone).send(res);
  }

  public static async updateMilestone(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const milestoneId = req.params.milestoneId as string;
    const dto = validateUpdateMilestone(req.body);
    const milestone = await GoalService.updateMilestone(userId, goalId, milestoneId, dto);
    return new SuccessResponse("Milestone updated successfully", milestone).send(res);
  }

  public static async deleteMilestone(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const milestoneId = req.params.milestoneId as string;
    await GoalService.deleteMilestone(userId, goalId, milestoneId);
    return new SuccessMsgResponse("Milestone deleted successfully").send(res);
  }

  // Task Controllers
  public static async createTask(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const dto = validateCreateGoalTask(req.body);
    const task = await GoalService.createTask(userId, goalId, dto);
    return new SuccessResponse("Task created successfully", task).send(res);
  }

  public static async updateTask(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const taskId = req.params.taskId as string;
    const dto = validateUpdateGoalTask(req.body);
    const task = await GoalService.updateTask(userId, goalId, taskId, dto);
    return new SuccessResponse("Task updated successfully", task).send(res);
  }

  public static async deleteTask(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const taskId = req.params.taskId as string;
    await GoalService.deleteTask(userId, goalId, taskId);
    return new SuccessMsgResponse("Task deleted successfully").send(res);
  }

  // Daily Action Controllers
  public static async createDailyAction(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const dto = validateCreateDailyAction(req.body);
    const action = await GoalService.createDailyAction(userId, goalId, dto);
    return new SuccessResponse("Daily action logged successfully", action).send(res);
  }

  public static async deleteDailyAction(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const goalId = req.params.goalId as string;
    const actionId = req.params.actionId as string;
    await GoalService.deleteDailyAction(userId, goalId, actionId);
    return new SuccessMsgResponse("Daily action deleted successfully").send(res);
  }
}
