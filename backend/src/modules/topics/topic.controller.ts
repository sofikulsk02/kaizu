import { Request, Response } from "express";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";
import { TopicService } from "./topic.service";
import { validateCreateTopic, validateUpdateTopic } from "./topic.schema";
import { BadRequestError } from "../../core/ApiError";

export class TopicController {
  public static async createTopic(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const chapterId = (req.params.chapterId || req.body.chapterId) as string;

    if (!chapterId) {
      throw new BadRequestError("chapterId is required");
    }

    const dto = validateCreateTopic(req.body);
    const topic = await TopicService.createTopic(userId, chapterId, dto);
    return new SuccessResponse("Topic created successfully", topic).send(res);
  }

  public static async updateTopic(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = validateUpdateTopic(req.body);
    const topic = await TopicService.updateTopic(userId, id, dto);
    return new SuccessResponse("Topic updated successfully", topic).send(res);
  }

  public static async deleteTopic(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await TopicService.deleteTopic(userId, id);
    return new SuccessMsgResponse("Topic deleted successfully").send(res);
  }
}
