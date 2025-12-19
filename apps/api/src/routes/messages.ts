import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as messagesController from "../controllers/messagesController";

const router = Router();

// All message routes require authentication
router.use(requireAuth);

/**
 * GET /api/messages
 * Fetches the last 100 messages for the authenticated user.
 */
router.get("/", messagesController.listMessages);

/**
 * GET /api/messages/:id
 * Fetches a single message by its ID.
 */
router.get("/:id", messagesController.getMessage);

/**
 * GET /api/messages/thread/:threadId
 * Fetches all messages for a given thread.
 */
router.get("/thread/:threadId", messagesController.getThread);

/**
 * POST /api/messages/send
 * Sends a new outbound email.
 */
router.post("/send", messagesController.sendMessage);

/**
 * POST /api/messages/reply
 * Sends a reply to an existing thread.
 */
router.post("/reply", messagesController.replyToThread);

export default router;