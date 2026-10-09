import { prisma } from "../../database/prisma";
import { BadRequestError } from "../../core/ApiError";
import { GoalService } from "../goals/goal.service";

export interface QuickCaptureDto {
  input: string; // Natural language or plain text entry
  goalId?: string;
  type?: "DAILY_ACTION" | "TASK" | "NOTE";
}

export class QuickCaptureService {
  public static async processCapture(userId: string, dto: QuickCaptureDto) {
    if (!dto.input || typeof dto.input !== "string" || !dto.input.trim()) {
      throw new BadRequestError("Quick capture 'input' text is required");
    }

    const rawInput = dto.input.trim();
    let durationMinutes: number | undefined = undefined;

    // Extract time duration patterns like "45 mins", "45 minutes", "1 hour", "1.5 hours", "30m", "2h"
    const hourMatch = rawInput.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
    const minMatch = rawInput.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);

    if (hourMatch) {
      durationMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    } else if (minMatch) {
      durationMinutes = parseInt(minMatch[1], 10);
    }

    // Clean summary text by stripping duration keywords if present
    let summaryText = rawInput
      .replace(/for\s+\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/gi, "")
      .replace(/\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/gi, "")
      .trim();

    if (!summaryText) summaryText = rawInput;

    // Find target goal if goalId provided or match by title
    let targetGoalId = dto.goalId;

    if (!targetGoalId) {
      const userGoals = await prisma.goal.findMany({
        where: { userId, status: "ACTIVE" },
        select: { id: true, title: true },
      });

      const matchedGoal = userGoals.find((g) =>
        summaryText.toLowerCase().includes(g.title.toLowerCase())
      );

      if (matchedGoal) {
        targetGoalId = matchedGoal.id;
      } else if (userGoals.length > 0) {
        targetGoalId = userGoals[0].id;
      }
    }

    if (!targetGoalId) {
      // If no goals exist, create a default goal for quick capture
      const newGoal = await prisma.goal.create({
        data: {
          userId,
          title: "General Focus & Continuous Improvement",
          category: "Personal Growth",
          status: "ACTIVE",
        },
      });
      targetGoalId = newGoal.id;
    }

    // Capture as DailyAction
    const dailyAction = await GoalService.createDailyAction(userId, targetGoalId, {
      summary: summaryText,
      durationMinutes,
      occurredAt: new Date(),
    });

    return {
      success: true,
      summary: summaryText,
      durationMinutes,
      goalId: targetGoalId,
      dailyAction,
    };
  }
}
