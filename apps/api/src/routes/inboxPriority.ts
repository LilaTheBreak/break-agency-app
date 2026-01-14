import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * PRIORITY INBOX
 *
 * Ranks messages by:
 * - unread first
 * - priority field (0–2)
 * - deal-linked messages
 * - recency
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const messages = await prisma.inboxMessage.findMany({
      where: {
        userId, // Filter by user
      },
      include: {
        InboxThreadMeta: true,
      },
      orderBy: {
        receivedAt: "desc",
      },
      take: 100,
    });

    const scored = messages
      .map((m) => {
        let score = 0;
        const threadMeta = m.InboxThreadMeta;
        if (!m.isRead) score += 30;
        score += (threadMeta?.priority || 0) * 10;
        if (threadMeta?.linkedDealId) score += 20;
        return { ...m, score };
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      ok: true,
      count: scored.length,
      data: scored,
    });
  } catch (err) {
    console.error("PRIORITY INBOX ERROR:", err);
    res.status(500).json({ ok: false, error: "Failed to load priority inbox" });
  }
});

export default router;
