import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { createRateLimiter, RATE_LIMITS } from "../middleware/rateLimit.js";
import { classifyMessage } from "../services/inboxClassifier.js";
import { scanGmail } from "../services/gmailScanner.js";
import { autoLinkDeal } from "../services/dealLinker.js";

const router = Router();

// Rate limiter for inbox scan operations (conservative: 3 per 10 minutes)
const inboxScanLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3, // 3 scans per 10 minutes
  message: "Too many inbox scan requests. Please wait before scanning again.",
  keyGenerator: (req) => (req as any).user?.id || req.ip || "unknown",
});

/**
 * Trigger unified inbox scan
 */
router.post("/api/inbox/scan", requireAuth, inboxScanLimiter, async (req, res) => {
  try {
    const gmailMessages = await scanGmail(req.user!);

    const saved = [];

    for (const msg of gmailMessages) {
      const savedMsg = await prisma.inboxMessage.upsert({
        where: { threadId: msg.threadId },
        update: {
          // Update fields if message already exists
          sender: msg.from,
          subject: msg.subject,
          body: msg.body,
          receivedAt: msg.receivedAt,
        },
        create: {
          id: `msg-${Date.now()}`,
          platform: "gmail",
          threadId: msg.threadId,
          userId: req.user!.id,
          sender: msg.from,
          subject: msg.subject,
          body: msg.body,
          receivedAt: msg.receivedAt,
        },
      });

      // Classify each message using AI
      const classification = await classifyMessage(savedMsg);

      // NOTE: inboxClassification model does not exist in schema
      // Classification data can be stored in InboxThreadMeta or message metadata
      // For now, we just use it for routing logic below
      // await prisma.inboxClassification.create({
      //   data: {
      //     messageId: savedMsg.id,
      //     type: classification.type,
      //     confidence: classification.confidence,
      //     brandName: classification.brandName,
      //     dealValue: classification.dealValue,
      //     deadline: classification.deadline,
      //     autoLinked: false,
      //   },
      // });

      // Auto-routing logic for priority - set on InboxThreadMeta instead of InboxMessage
      const threadMeta = await prisma.inboxThreadMeta.upsert({
        where: { threadId: savedMsg.threadId },
        create: {
          threadId: savedMsg.threadId,
          userId: req.user?.id || userId,
          priority: (classification.type === "deal" || classification.type === "negotiation") ? 2 : 1,
          unreadCount: 1
        },
        update: {
          priority: (classification.type === "deal" || classification.type === "negotiation") ? 2 : 1
        }
      });

      // Deal linking engine
      await autoLinkDeal(savedMsg, classification);

      saved.push(savedMsg);
    }

    res.json({ success: true, count: saved.length });
  } catch (err) {
    console.error("Inbox Scan Failed", err);
    res.status(500).json({ success: false, error: "Inbox scan failed" });
  }
});

/**
 * Fetch Priority Inbox
 */
router.get("/api/inbox/priority", requireAuth, async (req, res) => {
  const messages = await prisma.inboxMessage.findMany({
    where: { 
      InboxThreadMeta: { 
        priority: { gte: 1 },
        userId: req.user?.id || ""
      }
    },
    include: {
      InboxThreadMeta: true
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  res.json({ success: true, data: { messages } });
});

/**
 * Awaiting Reply (Unread by brand)
 */
router.get("/api/inbox/awaiting-reply", requireAuth, async (req, res) => {
  const messages = await prisma.inboxMessage.findMany({
    where: { isRead: false }, // Get unread messages
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  res.json({ success: true, data: { messages } });
});

/**
 * GET /api/inbox/open/:id
 * Endpoint for tracking pixel to mark an email as opened.
 */
router.get("/api/inbox/open/:id", async (req, res) => {
  try {
    await prisma.inboxMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    const gif = Buffer.from("R0lGODlhAQABAAAAACH5BAEKAAEA", "base64");
    res.setHeader("Content-Type", "image/gif");
    res.send(gif);
  } catch (error) {
    console.error("Failed to track email open:", error);
    res.status(500).send("Error tracking open.");
  }
});

export default router;