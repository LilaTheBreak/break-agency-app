import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { syncGmailForUser } from "../services/gmail/syncGmail.js";
import { getOAuthClientForUser } from "../services/gmail/tokens.js";

const router = Router();

// GET /api/gmail/messages — list last 50 inbox messages
router.get("/gmail/messages", requireAuth, async (req, res, next) => {
  try {
    const messages = await prisma.inboxMessage.findMany({
      where: { userId: req.user!.id },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: { emails: { orderBy: { date: "asc" } } }
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// GET /api/gmail/messages/:id — fetch message details
router.get("/gmail/messages/:id", requireAuth, async (req, res, next) => {
  try {
    const message = await prisma.inboundEmail.findFirst({
      where: { id: req.params.id, inboxMessage: { userId: req.user!.id } }
    });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// GET /api/gmail/threads/:id — get full thread with replies
router.get("/gmail/threads/:id", requireAuth, async (req, res, next) => {
  try {
    const thread = await prisma.inboxMessage.findFirst({
      where: { threadId: req.params.id, userId: req.user!.id },
      include: { emails: { orderBy: { date: "asc" } } }
    });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
  } catch (error) {
    next(error);
  }
});

// POST /api/gmail/sync — trigger Gmail sync manually
router.post("/gmail/sync", requireAuth, async (req, res, next) => {
  try {
    const stats = await syncGmailForUser(req.user!.id);
    res.json({ message: "Gmail sync completed successfully.", ...stats });
  } catch (error) {
    next(error);
  }
});

export default router;
