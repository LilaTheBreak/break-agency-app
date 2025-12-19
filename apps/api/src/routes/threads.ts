import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as threadController from "../controllers/threadController.js";

const router = Router();

// GET /api/threads - List all unified threads for the current user
router.get("/", requireAuth, threadController.listThreads);

// GET /api/threads/:threadId - Get full metadata for a single thread
router.get("/:threadId", requireAuth, threadController.getThreadDetails);

// GET /api/threads/:threadId/messages - Get all messages for a single thread
router.get(
  "/:threadId/messages",
  requireAuth,
  threadController.getThreadMessages
);

// POST /api/threads/:threadId/summarise - Trigger AI summarization for a thread
router.post(
  "/:threadId/summarise",
  requireAuth,
  threadController.summariseThread
);

// POST /api/threads/:threadId/reply - Send a reply to a thread
router.post("/:threadId/reply", requireAuth, threadController.replyToThread);

export default router;