import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Awaiting Reply logic (schema-accurate):
 * - Outbound emails = fromEmail === logged in user's email
 * - Threading is based on InboundEmail.threadId
 * - "Awaiting reply" when:
 *      - No later inbound messages in same thread, OR
 *      - There are later inbound messages but none are read
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userEmail = req.user!.email;

    if (!userEmail) {
      return res.status(400).json({ ok: false, error: "User email missing" });
    }

    // 1️⃣ Load recent outbound emails
    const outboundEmails = await prisma.inboundEmail.findMany({
      where: {
        fromEmail: userEmail, // This user SENT the message
      },
      orderBy: { receivedAt: "desc" },
      take: 50,
    });

    const awaiting = [];

    for (const msg of outboundEmails) {
      if (!msg.threadId) continue;

      // 2️⃣ Find all subsequent messages in the same thread
      const laterMessages = await prisma.inboundEmail.findMany({
        where: {
          threadId: msg.threadId,
          receivedAt: { gt: msg.receivedAt },
        },
        orderBy: { receivedAt: "asc" },
      });

      // inbound messages = ones not from the user
      const inboundReplies = laterMessages.filter((m) => m.fromEmail !== userEmail);

      const unreadReplies = inboundReplies.filter((m) => !m.isRead);

      const shouldInclude =
        inboundReplies.length === 0 || unreadReplies.length > 0;

      if (shouldInclude) {
        awaiting.push({
          id: msg.id,
          subject: msg.subject,
          receivedAt: msg.receivedAt,
          threadId: msg.threadId,
          awaitingReason: {
            noReply: inboundReplies.length === 0,
            unreadReplies: unreadReplies.length,
          },
        });
      }
    }

    return res.json({
      ok: true,
      count: awaiting.length,
      data: awaiting,
    });
  } catch (error) {
    console.error("AWAITING REPLY ERROR:", error);
    return res.status(500).json({ ok: false, error: "Failed to load awaiting replies" });
  }
});

export default router;
