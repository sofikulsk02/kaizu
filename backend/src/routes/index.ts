import { Router } from "express";
import userRoutes from "../modules/users/user.routes";
import subjectRoutes from "../modules/subjects";
import chapterRoutes from "../modules/chapters";
import topicRoutes from "../modules/topics";
import goalRoutes from "../modules/goals";
import { projectRoutes } from "../modules/projects";

const router = Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Kaizu API", timestamp: new Date().toISOString() });
});

// Domain API routes
router.use("/api/auth", userRoutes);
router.use("/api/subjects", subjectRoutes);
router.use("/api/chapters", chapterRoutes);
router.use("/api/topics", topicRoutes);
router.use("/api/goals", goalRoutes);
router.use("/api/projects", projectRoutes);

export default router;

