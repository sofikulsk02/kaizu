import { Request, Response } from "express";
import { AssistantService } from "./assistant.service";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { BadRequestError } from "../../core/ApiError";
import { SuccessResponse, SuccessMsgResponse } from "../../core/ApiResponse";

export class AssistantController {
  /**
   * Streaming chat endpoint via Server-Sent Events (SSE)
   */
  static chat = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new BadRequestError("Authenticated user context missing");
    }

    const { message, conversationId, pageContext } = req.body;

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      const result = await AssistantService.streamChat(
        user.id,
        user.name,
        message,
        conversationId,
        pageContext,
        (chunkText: string) => {
          // Stream data chunk event to client
          res.write(`data: ${JSON.stringify({ type: "chunk", text: chunkText })}\n\n`);
        }
      );

      // Send completion event
      res.write(
        `data: ${JSON.stringify({
          type: "done",
          conversationId: result.conversationId,
          fullResponse: result.fullResponse,
        })}\n\n`
      );
      res.end();
    } catch (err: any) {
      console.error("Assistant chat streaming error:", err);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: err.message || "An error occurred during response streaming.",
          statusCode: err.statusCode || 500,
        })}\n\n`
      );
      res.end();
    }
  });

  /**
   * List all conversations for the user
   */
  static listConversations = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const conversations = await AssistantService.listConversations(user.id);
    return new SuccessResponse("Conversations retrieved successfully", conversations).send(res);
  });

  /**
   * Get messages for a specific conversation
   */
  static getConversation = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const id = req.params.id as string;
    const conversation = await AssistantService.getConversation(id, user.id);
    return new SuccessResponse("Conversation retrieved successfully", conversation).send(res);
  });

  /**
   * Delete a conversation
   */
  static deleteConversation = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const id = req.params.id as string;
    await AssistantService.deleteConversation(id, user.id);
    return new SuccessMsgResponse("Conversation deleted successfully").send(res);
  });

  /**
   * Get user rate limit and usage information
   */
  static getUsage = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const usage = await AssistantService.getUsageStats(user.id);
    return new SuccessResponse("Usage retrieved successfully", usage).send(res);
  });
}

