import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as gmailInboxController from "../controllers/gmailInboxController.js";

const router = Router();

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
router.post("/sync", requireAuth, gmailInboxController.syncInbox);

export default router;
