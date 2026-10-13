import { Router } from "express";
import { ProjectController } from "./project.controller";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// Project CRUD
router.post("/", asyncHandler(ProjectController.createProject));
router.get("/", asyncHandler(ProjectController.getProjects));
router.put("/reorder", asyncHandler(ProjectController.reorderProjects));
router.get("/:id", asyncHandler(ProjectController.getProjectById));
router.patch("/:id", asyncHandler(ProjectController.updateProject));
router.delete("/:id", asyncHandler(ProjectController.deleteProject));

// Milestones
router.post("/:projectId/milestones", asyncHandler(ProjectController.createMilestone));
router.patch("/:projectId/milestones/:milestoneId", asyncHandler(ProjectController.updateMilestone));
router.delete("/:projectId/milestones/:milestoneId", asyncHandler(ProjectController.deleteMilestone));

// Tasks
router.post("/:projectId/tasks", asyncHandler(ProjectController.createTask));
router.patch("/:projectId/tasks/:taskId", asyncHandler(ProjectController.updateTask));
router.delete("/:projectId/tasks/:taskId", asyncHandler(ProjectController.deleteTask));

// Work Sessions
router.post("/:projectId/work-sessions", asyncHandler(ProjectController.createWorkSession));
router.delete("/:projectId/work-sessions/:sessionId", asyncHandler(ProjectController.deleteWorkSession));

// Notes & Decisions
router.post("/:projectId/notes", asyncHandler(ProjectController.createNote));
router.patch("/:projectId/notes/:noteId", asyncHandler(ProjectController.updateNote));
router.delete("/:projectId/notes/:noteId", asyncHandler(ProjectController.deleteNote));

export default router;
