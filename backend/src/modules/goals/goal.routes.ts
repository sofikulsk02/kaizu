import { Router } from "express";
import { GoalController } from "./goal.controller";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// Goal CRUD
router.post("/", asyncHandler(GoalController.createGoal));
router.get("/", asyncHandler(GoalController.getGoals));
router.get("/:id", asyncHandler(GoalController.getGoalById));
router.patch("/:id", asyncHandler(GoalController.updateGoal));
router.delete("/:id", asyncHandler(GoalController.deleteGoal));

// Intelligent AI Goal Coach Endpoints
router.get("/:goalId/coach", asyncHandler(GoalController.getCoachAnalysis));
router.post("/:goalId/coach/breakdown", asyncHandler(GoalController.generateGoalBreakdown));

// Quick Capture Endpoint
router.post("/quick-capture", asyncHandler(GoalController.quickCapture));

// Milestones
router.post("/:goalId/milestones", asyncHandler(GoalController.createMilestone));
router.patch("/:goalId/milestones/:milestoneId", asyncHandler(GoalController.updateMilestone));
router.delete("/:goalId/milestones/:milestoneId", asyncHandler(GoalController.deleteMilestone));

// Tasks
router.post("/:goalId/tasks", asyncHandler(GoalController.createTask));
router.patch("/:goalId/tasks/:taskId", asyncHandler(GoalController.updateTask));
router.delete("/:goalId/tasks/:taskId", asyncHandler(GoalController.deleteTask));

// Daily Actions
router.post("/:goalId/daily-actions", asyncHandler(GoalController.createDailyAction));
router.delete("/:goalId/daily-actions/:actionId", asyncHandler(GoalController.deleteDailyAction));

export default router;
