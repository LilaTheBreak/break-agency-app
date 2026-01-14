import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import { getThread, listThreads } from '../controllers/inboxThreadController.js';

const router = Router();

/**
 * GET /api/inbox/thread/:threadId
 */
router.get("/api/inbox/thread/:threadId", requireAuth, getThread);
router.get("/api/inbox/threads", requireAuth, listThreads);

export default router;
