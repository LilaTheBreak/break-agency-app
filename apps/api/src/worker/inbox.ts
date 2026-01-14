import { Router } from "express";
import { getUserMessages } from '../integrations/gmail/googleClient.js';
import prisma from '../lib/prisma.js';
import { inboxQueue } from '../queues/index.js';
import { cleanEmailBody, extractPlainText } from '../services/inbox/normalizeEmail.js';
import { classifyEmail } from '../services/inbox/classifyEmail.js';

const router = Router();

// A mock user ID for development. In a real app, this would come from auth.
const MOCK_USER_ID = "clxrz45gn000008l4hy285p0g";

/**
 * GET /inbox/sync
 * Fetches recent messages from Gmail, saves them, and queues them for AI processing.
 */
router.get("/sync", async (req, res, next) => {
  try {
    const messages = await getUserMessages(MOCK_USER_ID);
    let newCount = 0;

    for (const message of messages) {
      const existing = await prisma.inboundEmail.findFirst({
        where: { userId: MOCK_USER_ID, subject: message.subject || "", receivedAt: new Date(message.date || 0) }
      });

      if (!existing) {
        const plainTextBody = message.snippet ? cleanEmailBody(extractPlainText(message.snippet)) : "";
        const newEmail = await prisma.inboundEmail.create({
          data: {
            userId: MOCK_USER_ID,
            subject: message.subject || "No Subject",
            snippet: message.snippet,
            body: plainTextBody,
            from: "mock-user@gmail.com", // Placeholder
            to: "me@break.dev", // Placeholder
            receivedAt: new Date(message.date || Date.now())
          }
        });

        await inboxQueue.add("process-email", { emailId: newEmail.id });
        newCount++;
      }
    }

    return res.json({
      message: `Synced ${messages.length} messages, ${newCount} new emails queued for processing.`
    });
  } catch (error) {
    console.error("[INBOX SYNC ERROR]", error);
    // Provide a helpful message in stub mode
    if (error instanceof Error && error.message.includes("Gmail not connected")) {
      return res.status(200).json({
        message: "Gmail sync skipped (running in stub mode). Use /inbox/test to simulate."
      });
    }
    next(error);
  }
});

/**
 * POST /inbox/test
 * Accepts a raw text payload to test the AI classification pipeline directly.
 */
router.post("/test", async (req, res, next) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ error: "Subject and body are required." });
    }
    const classification = await classifyEmail(subject, body);
    return res.json(classification);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /inbox/recent
 * Returns the last 20 processed emails with their AI-generated insights.
 */
router.get("/recent", async (req, res, next) => {
  try {
    const recentEmails = await prisma.inboundEmail.findMany({
      where: { userId: MOCK_USER_ID },
      orderBy: { receivedAt: "desc" },
      take: 20,
      select: {
        id: true,
        subject: true,
        receivedAt: true,
        aiCategory: true,
        aiBrand: true,
        aiUrgency: true,
        aiSummary: true,
        priorityScore: true,
        dealDraftId: true
      }
    });
    return res.json(recentEmails);
  } catch (error) {
    next(error);
  }
});

export default router;