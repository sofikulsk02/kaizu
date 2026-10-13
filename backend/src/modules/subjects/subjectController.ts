import { Request, Response } from "express";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";
import { SubjectService } from "./subject.service";
import { validateCreateSubject, validateUpdateSubject, validateCreateStudySession } from "./subject.schema";

export class SubjectController {
  public static async createSubject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const dto = validateCreateSubject(req.body);
    const subject = await SubjectService.createSubject(userId, dto);
    return new SuccessResponse("Subject created successfully", subject).send(res);
  }

  public static async getSubjects(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const subjects = await SubjectService.getSubjects(userId);
    return new SuccessResponse("Subjects fetched successfully", subjects).send(res);
  }

  public static async reorderSubjects(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { orderedIds } = req.body;
    const result = await SubjectService.reorderSubjects(userId, orderedIds);
    return new SuccessResponse("Subjects reordered successfully", result).send(res);
  }

  public static async getSubjectById(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const subject = await SubjectService.getSubjectById(userId, id);
    return new SuccessResponse("Subject fetched successfully", subject).send(res);
  }

  public static async updateSubject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = validateUpdateSubject(req.body);
    const subject = await SubjectService.updateSubject(userId, id, dto);
    return new SuccessResponse("Subject updated successfully", subject).send(res);
  }

  public static async deleteSubject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await SubjectService.deleteSubject(userId, id);
    return new SuccessMsgResponse("Subject deleted successfully").send(res);
  }

  public static async createStudySession(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const subjectId = req.params.subjectId as string;
    const dto = validateCreateStudySession(req.body);
    const session = await SubjectService.createStudySession(userId, subjectId, dto);
    return new SuccessResponse("Study session logged successfully", session).send(res);
  }

  public static async deleteStudySession(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const subjectId = req.params.subjectId as string;
    const sessionId = req.params.sessionId as string;
    await SubjectService.deleteStudySession(userId, subjectId, sessionId);
    return new SuccessMsgResponse("Study session deleted successfully").send(res);
  }
}

