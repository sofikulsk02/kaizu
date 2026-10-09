import { Router } from "express";
import { AssistantController } from "./assistant.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Enforce auth on all assistant routes
router.use(authMiddleware);

router.post("/chat", AssistantController.chat);
router.get("/conversations", AssistantController.listConversations);
router.get("/conversations/:id", AssistantController.getConversation);
router.delete("/conversations/:id", AssistantController.deleteConversation);
router.get("/usage", AssistantController.getUsage);

export default router;
