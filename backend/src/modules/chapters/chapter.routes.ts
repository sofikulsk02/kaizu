import { Router } from "express";
import { ChapterController } from "./chapter.controller";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

// Subject-nested route or direct chapter creation
router.post("/subject/:subjectId", asyncHandler(ChapterController.createChapter));
router.get("/subject/:subjectId", asyncHandler(ChapterController.getChaptersBySubject));

// Direct chapter routes by ID
router.get("/:id", asyncHandler(ChapterController.getChapterById));
router.patch("/:id", asyncHandler(ChapterController.updateChapter));
router.delete("/:id", asyncHandler(ChapterController.deleteChapter));

export default router;
