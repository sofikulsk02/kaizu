import { Request, Response } from "express";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";
import { ProjectService } from "./project.service";
import {
  validateCreateProject,
  validateUpdateProject,
  validateCreateProjectMilestone,
  validateUpdateProjectMilestone,
  validateCreateProjectTask,
  validateUpdateProjectTask,
  validateCreateProjectWorkSession,
  validateCreateProjectNote,
  validateUpdateProjectNote,
} from "./project.schema";
import { ProjectStatus } from "../../generated/prisma/enums";

export class ProjectController {
  // Project CRUD
  public static async createProject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const dto = validateCreateProject(req.body);
    const project = await ProjectService.createProject(userId, dto);
    return new SuccessResponse("Project created successfully", project).send(res);
  }

  public static async getProjects(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const status = req.query.status as ProjectStatus | undefined;
    const projects = await ProjectService.getProjects(userId, status);
    return new SuccessResponse("Projects fetched successfully", projects).send(res);
  }

  public static async reorderProjects(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { orderedIds } = req.body;
    const result = await ProjectService.reorderProjects(userId, orderedIds);
    return new SuccessResponse("Projects reordered successfully", result).send(res);
  }

  public static async getProjectById(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const project = await ProjectService.getProjectById(userId, id);
    return new SuccessResponse("Project fetched successfully", project).send(res);
  }

  public static async updateProject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = validateUpdateProject(req.body);
    const project = await ProjectService.updateProject(userId, id, dto);
    return new SuccessResponse("Project updated successfully", project).send(res);
  }

  public static async deleteProject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await ProjectService.deleteProject(userId, id);
    return new SuccessMsgResponse("Project deleted successfully").send(res);
  }

  // Milestones
  public static async createMilestone(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const dto = validateCreateProjectMilestone(req.body);
    const milestone = await ProjectService.createMilestone(userId, projectId, dto);
    return new SuccessResponse("Milestone created successfully", milestone).send(res);
  }

  public static async updateMilestone(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const milestoneId = req.params.milestoneId as string;
    const dto = validateUpdateProjectMilestone(req.body);
    const milestone = await ProjectService.updateMilestone(userId, projectId, milestoneId, dto);
    return new SuccessResponse("Milestone updated successfully", milestone).send(res);
  }

  public static async deleteMilestone(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const milestoneId = req.params.milestoneId as string;
    await ProjectService.deleteMilestone(userId, projectId, milestoneId);
    return new SuccessMsgResponse("Milestone deleted successfully").send(res);
  }

  // Tasks
  public static async createTask(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const dto = validateCreateProjectTask(req.body);
    const task = await ProjectService.createTask(userId, projectId, dto);
    return new SuccessResponse("Task created successfully", task).send(res);
  }

  public static async updateTask(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const taskId = req.params.taskId as string;
    const dto = validateUpdateProjectTask(req.body);
    const task = await ProjectService.updateTask(userId, projectId, taskId, dto);
    return new SuccessResponse("Task updated successfully", task).send(res);
  }

  public static async deleteTask(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const taskId = req.params.taskId as string;
    await ProjectService.deleteTask(userId, projectId, taskId);
    return new SuccessMsgResponse("Task deleted successfully").send(res);
  }

  // Work Sessions
  public static async createWorkSession(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const dto = validateCreateProjectWorkSession(req.body);
    const session = await ProjectService.createWorkSession(userId, projectId, dto);
    return new SuccessResponse("Work session logged successfully", session).send(res);
  }

  public static async deleteWorkSession(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const sessionId = req.params.sessionId as string;
    await ProjectService.deleteWorkSession(userId, projectId, sessionId);
    return new SuccessMsgResponse("Work session deleted successfully").send(res);
  }

  // Notes
  public static async createNote(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const dto = validateCreateProjectNote(req.body);
    const note = await ProjectService.createNote(userId, projectId, dto);
    return new SuccessResponse("Note created successfully", note).send(res);
  }

  public static async updateNote(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const noteId = req.params.noteId as string;
    const dto = validateUpdateProjectNote(req.body);
    const note = await ProjectService.updateNote(userId, projectId, noteId, dto);
    return new SuccessResponse("Note updated successfully", note).send(res);
  }

  public static async deleteNote(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const projectId = req.params.projectId as string;
    const noteId = req.params.noteId as string;
    await ProjectService.deleteNote(userId, projectId, noteId);
    return new SuccessMsgResponse("Note deleted successfully").send(res);
  }
}
