import { Router } from "express";
import { SubjectController } from "../subjectController";
import { asyncHandler } from "../../../middlewares/asyncHandler";
import { authMiddleware } from "../../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", asyncHandler(SubjectController.createSubject));
router.get("/", asyncHandler(SubjectController.getSubjects));
router.put("/reorder", asyncHandler(SubjectController.reorderSubjects));
router.get("/:id", asyncHandler(SubjectController.getSubjectById));
router.patch("/:id", asyncHandler(SubjectController.updateSubject));
router.delete("/:id", asyncHandler(SubjectController.deleteSubject));

// Study Sessions
router.post("/:subjectId/sessions", asyncHandler(SubjectController.createStudySession));
router.delete("/:subjectId/sessions/:sessionId", asyncHandler(SubjectController.deleteStudySession));

export default router;