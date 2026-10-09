import { Request, Response } from "express";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";
import { ChapterService } from "./chapter.service";
import { validateCreateChapter, validateUpdateChapter } from "./chapter.schema";
import { BadRequestError } from "../../core/ApiError";

export class ChapterController {
  public static async createChapter(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const subjectId = (req.params.subjectId || req.body.subjectId) as string;

    if (!subjectId) {
      throw new BadRequestError("subjectId is required");
    }

    const dto = validateCreateChapter(req.body);
    const chapter = await ChapterService.createChapter(userId, subjectId, dto);
    return new SuccessResponse("Chapter created successfully", chapter).send(res);
  }

  public static async getChaptersBySubject(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const subjectId = req.params.subjectId as string;
    const chapters = await ChapterService.getChaptersBySubject(userId, subjectId);
    return new SuccessResponse("Chapters fetched successfully", chapters).send(res);
  }

  public static async getChapterById(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const chapter = await ChapterService.getChapterById(userId, id);
    return new SuccessResponse("Chapter fetched successfully", chapter).send(res);
  }

  public static async updateChapter(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = validateUpdateChapter(req.body);
    const chapter = await ChapterService.updateChapter(userId, id, dto);
    return new SuccessResponse("Chapter updated successfully", chapter).send(res);
  }

  public static async deleteChapter(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await ChapterService.deleteChapter(userId, id);
    return new SuccessMsgResponse("Chapter deleted successfully").send(res);
  }
}
