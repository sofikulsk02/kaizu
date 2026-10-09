import { Router } from "express";
import { UserController } from "./user.controller";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Public Google OAuth routes
router.get("/google", asyncHandler(UserController.getGoogleAuthUrl));
router.get("/google/callback", asyncHandler(UserController.handleGoogleCallback));
router.post("/google/verify", asyncHandler(UserController.verifyGoogleIdToken));

// Authenticated user routes
router.get("/me", authMiddleware, asyncHandler(UserController.getMe));
router.post("/dev-user", authMiddleware, asyncHandler(UserController.createDevUser));

export default router;
