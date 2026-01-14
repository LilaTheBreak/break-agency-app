import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import { createRateLimiter, RATE_LIMITS } from '../middleware/rateLimit';
import * as gmailInboxController from '../controllers/gmailInboxController';

const router = Router();

// Rate limiter for inbox sync operations (conservative: 5 per 5 minutes)
const inboxSyncLimiter = createRateLimiter({
  ...RATE_LIMITS.EMAIL_SEND, // Reuse email send limits (20 per hour)
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 5, // 5 syncs per 5 minutes
  message: "Too many inbox sync requests. Please wait before syncing again.",
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

// GET /api/gmail/inbox - Get paginated inbox threads
router.get("/", requireAuth, gmailInboxController.getInbox);

// GET /api/gmail/inbox/unread - Get unread inbox threads
router.get("/unread", requireAuth, gmailInboxController.getUnreadInbox);

// GET /api/gmail/inbox/search?q=... - Search across inbox threads
router.get("/search", requireAuth, gmailInboxController.searchInbox);

// GET /api/gmail/inbox/thread/:id - Get a single thread with all its messages
router.get(
  "/thread/:threadId",
  requireAuth,
  gmailInboxController.getThreadById
);

// POST /api/gmail/inbox/sync - Manually trigger a sync with the user's Gmail account
router.post("/sync", requireAuth, inboxSyncLimiter, gmailInboxController.syncInbox);

export default router;
