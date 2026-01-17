import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

async function getAwaitingReplyCount(userId: string, userEmail: string): Promise<number> {
  // Fetch recent outbound emails with thread info
  const outboundEmails = await prisma.inboundEmail.findMany({
    where: { fromEmail: userEmail },
    orderBy: { receivedAt: "desc" },
    take: 100, // Limit the search space for performance
    select: { id: true, threadId: true, receivedAt: true }
  });

  if (outboundEmails.length === 0) return 0;

  // Get all thread IDs
  const threadIds = outboundEmails
    .filter(msg => msg.threadId)
    .map(msg => msg.threadId);

  if (threadIds.length === 0) return 0;

  // Fetch all replies in one query instead of per-message queries
  const replyCounts = await prisma.inboundEmail.groupBy({
    by: ['threadId'],
    where: {
      threadId: { in: threadIds },
      NOT: { fromEmail: userEmail },
    },
    _count: { id: true },
  });

  // Create map of thread to reply count
  const replyMap = new Map(replyCounts.map(r => [r.threadId, r._count.id]));

  // Count threads where there are no replies after the outbound email
  let awaitingCount = 0;
  for (const msg of outboundEmails) {
    if (!msg.threadId) continue;
    const replyCount = replyMap.get(msg.threadId) || 0;
    if (replyCount === 0) {
      awaitingCount++;
    }
  }
  return awaitingCount;
}

/**
 * GET /api/inbox/counters
 * Returns unread and priority counts for the user's inbox.
 */
router.get("/api/inbox/counters", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    if (!userEmail) {
      return res.status(400).json({ success: false, error: "User email is required for counters." });
    }

    const [unreadEmails, unreadDMs, highPriority, awaitingReply] = await Promise.all([
      prisma.inboundEmail.count({ where: { userId, isRead: false } }),
      prisma.inboxMessage.count({ where: { userId, isRead: false } }),
      prisma.inboxMessage.count({ where: { InboxThreadMeta: { priority: 2, userId } } }),
      getAwaitingReplyCount(userId, userEmail),
    ]);

    const counters = {
      unreadEmails,
      unreadDMs,
      highPriority,
      awaitingReply,
      totalUnread: unreadEmails + unreadDMs,
    };

    res.json({ success: true, data: counters });
  } catch (error) {
    console.error("Failed to fetch inbox counters:", error);
    res.status(500).json({ success: false, error: "Could not load inbox counters." });
  }
});

export default router;