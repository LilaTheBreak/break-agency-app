import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { classifyMessage } from "../services/inboxClassifier.js";
import { scanGmail } from "../services/gmailScanner.js";
import { autoLinkDeal } from "../services/dealLinker.js";

const router = Router();

/**
 * Trigger unified inbox scan
 */
router.post("/api/inbox/scan", requireAuth, async (req, res) => {
  try {
    const gmailMessages = await scanGmail(req.user!);

    const saved = [];

    for (const msg of gmailMessages) {
      const savedMsg = await prisma.inboxMessage.upsert({
        where: { externalId: msg.id },
        update: {
          // Update fields if message already exists
          sender: msg.from,
          senderEmail: msg.fromEmail,
          subject: msg.subject,
          body: msg.body,
          receivedAt: msg.receivedAt,
        },
        create: {
          source: "gmail",
          externalId: msg.id,
          threadId: msg.threadId,
          sender: msg.from,
          senderEmail: msg.fromEmail,
          subject: msg.subject,
          body: msg.body,
          receivedAt: msg.receivedAt,
        },
      });

      // Classify each message using AI
      const classification = await classifyMessage(savedMsg);

      await prisma.inboxClassification.create({
        data: {
          messageId: savedMsg.id,
          type: classification.type,
          confidence: classification.confidence,
          brandName: classification.brandName,
          dealValue: classification.dealValue,
          deadline: classification.deadline,
          autoLinked: false, // Default to false, updated by dealLinker
        },
      });

      // Auto-routing logic for priority
      if (classification.type === "deal" || classification.type === "negotiation") {
        await prisma.inboxMessage.update({
          where: { id: savedMsg.id },
          data: { priority: 2 },
        });
      } else if (classification.type === "event" || classification.type === "press") {
        await prisma.inboxMessage.update({
          where: { id: savedMsg.id },
          data: { priority: 1 },
        });
      }

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
    where: { priority: { gte: 1 } },
    include: {
      classified: true,
      linkedDeals: true,
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
    where: { openedAt: null }, // Assuming 'openedAt' is set when the user views it
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
      data: { openedAt: new Date() },
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