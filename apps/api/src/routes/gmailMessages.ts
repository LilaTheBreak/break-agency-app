import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { syncGmailForUser } from "../services/gmail/syncGmail.js";
import { getOAuthClientForUser } from "../services/gmail/tokens.js";

const router = Router();

// GET /messages — list last 50 inbox messages
router.get("/messages", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Check if Gmail is connected
    const token = await prisma.gmailToken.findUnique({ 
      where: { userId },
      select: { 
        refreshToken: true,
        lastError: true,
        lastErrorAt: true,
        lastSyncedAt: true,
      }
    });
    
    if (!token || !token.refreshToken) {
      console.log(`[GMAIL MESSAGES] No Gmail token found for user ${userId}`);
      return res.status(404).json({
        error: "gmail_not_connected",
        message: "Gmail account is not connected. Please authenticate to continue.",
        messages: [] // Return empty array so frontend doesn't crash
      });
    }

    // Check if there's a recent sync error
    if (token.lastError && token.lastErrorAt) {
      const errorAge = Date.now() - token.lastErrorAt.getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (errorAge < oneHour) {
        console.warn(`[GMAIL MESSAGES] Recent sync error for user ${userId}:`, token.lastError);
        // Still return messages if any exist, but log the error
      }
    }

    const messages = await prisma.inboxMessage.findMany({
      where: { userId },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: { InboundEmail: { orderBy: { receivedAt: "asc" } } }
    });
    
    // Log if inbox is empty but Gmail is connected (might need sync)
    if (messages.length === 0 && token.lastSyncedAt === null) {
      console.log(`[GMAIL MESSAGES] Inbox is empty for user ${userId} and never synced. User may need to trigger sync.`);
    }
    
    res.json(messages);
  } catch (error) {
    console.error("[GMAIL MESSAGES] Error fetching messages:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
    });
    next(error);
  }
});

// GET /messages/:id — fetch message details
router.get("/messages/:id", requireAuth, async (req, res, next) => {
  try {
    const message = await prisma.inboundEmail.findFirst({
      where: { 
        id: req.params.id, 
        userId: req.user!.id 
      }
    });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// GET /threads/:id — get full thread with replies
router.get("/threads/:id", requireAuth, async (req, res, next) => {
  try {
    const thread = await prisma.inboxMessage.findFirst({
      where: { threadId: req.params.id, userId: req.user!.id },
      include: { InboundEmail: { orderBy: { receivedAt: "asc" } } }
    });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread);
  } catch (error) {
    next(error);
  }
});

// POST /sync — trigger Gmail sync manually
router.post("/sync", requireAuth, gmailSyncLimiter, async (req, res, next) => {
  try {
    const stats = await syncGmailForUser(req.user!.id);
    res.json({ message: "Gmail sync completed successfully.", ...stats });
  } catch (error) {
    next(error);
  }
});

export default router;
