import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { syncGmailForUser } from "../services/gmail/syncGmail.js";
import { getOAuthClientForUser } from "../services/gmail/tokens.js";
import { createRateLimiter, userKeyGenerator } from "../middleware/rateLimit.js";

const router = Router();

// Gmail sync rate limiter: 5 syncs per hour per user
// Production-grade rate limiting to prevent abuse and API quota exhaustion
const gmailSyncLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 syncs per hour per user
  keyGenerator: (req) => `gmail-sync:${userKeyGenerator(req)}`,
  message: "Too many Gmail sync requests. Please wait before syncing again.",
  statusCode: 429,
});

// GET /messages — list last 50 inbox messages (grouped by thread)
// Returns InboxMessage records with full email threads
router.get("/messages", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query.unreadOnly === "true";
    
    console.log(`[GMAIL MESSAGES] Fetching messages for user ${userId}`, {
      unreadOnly,
      limit: 50,
      timestamp: new Date().toISOString()
    });
    
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
      where: { 
        userId,
        platform: "gmail",
        // Support filtering by unread status
        ...(unreadOnly && { isRead: false })
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: { 
        InboundEmail: { 
          orderBy: { receivedAt: "asc" },
          take: 50 // Limit emails per thread to prevent huge payloads
        } 
      }
    });
    
    console.log(`[GMAIL MESSAGES] Retrieved ${messages.length} messages for user ${userId}`, {
      lastSyncedAt: token.lastSyncedAt?.toISOString() || "never",
      empty: messages.length === 0,
      timestamp: new Date().toISOString()
    });
    
    // Log if inbox is empty but Gmail is connected (might need sync)
    if (messages.length === 0 && token.lastSyncedAt === null) {
      console.log(`[GMAIL MESSAGES] Inbox is empty for user ${userId} and never synced. Initial sync may still be running or pending.`);
    }
    
    res.json(messages);
  } catch (error) {
    console.error("[GMAIL MESSAGES] Error fetching messages:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
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
