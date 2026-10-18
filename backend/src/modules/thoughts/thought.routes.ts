import { Router } from "express";
import { ThoughtController } from "./thought.controller";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Strictly authenticate all Thought operations
router.use(authMiddleware);

router.post("/", asyncHandler(ThoughtController.createThought));
router.get("/", asyncHandler(ThoughtController.getThoughts));
router.get("/:id", asyncHandler(ThoughtController.getThoughtById));
router.patch("/:id", asyncHandler(ThoughtController.updateThought));
router.delete("/:id", asyncHandler(ThoughtController.deleteThought));

export default router;
