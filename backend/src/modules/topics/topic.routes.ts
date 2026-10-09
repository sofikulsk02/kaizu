import { Router } from "express";
import { TopicController } from "./topic.controller";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// Chapter-nested topic route
router.post("/chapter/:chapterId", asyncHandler(TopicController.createTopic));

// Direct topic routes
router.patch("/:id", asyncHandler(TopicController.updateTopic));
router.delete("/:id", asyncHandler(TopicController.deleteTopic));

export default router;
