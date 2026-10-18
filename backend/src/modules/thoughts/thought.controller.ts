import { Request, Response } from "express";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";
import { ThoughtService } from "./thought.service";
import { validateCreateThought, validateUpdateThought } from "./thought.schema";

export class ThoughtController {
  public static async createThought(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const dto = validateCreateThought(req.body);
    const thought = await ThoughtService.createThought(userId, dto);
    return new SuccessResponse("Thought created successfully", thought).send(res);
  }

  public static async getThoughts(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const search = req.query.search as string | undefined;
    const thoughts = await ThoughtService.getThoughts(userId, search);
    return new SuccessResponse("Thoughts fetched successfully", thoughts).send(res);
  }

  public static async getThoughtById(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const thought = await ThoughtService.getThoughtById(userId, id);
    return new SuccessResponse("Thought fetched successfully", thought).send(res);
  }

  public static async updateThought(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const dto = validateUpdateThought(req.body);
    const thought = await ThoughtService.updateThought(userId, id, dto);
    return new SuccessResponse("Thought updated successfully", thought).send(res);
  }

  public static async deleteThought(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await ThoughtService.deleteThought(userId, id);
    return new SuccessMsgResponse("Thought deleted successfully").send(res);
  }
}
