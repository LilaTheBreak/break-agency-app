import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/inbox/categories
 * Returns inbox items grouped by smart categories.
 */
router.get("/api/inbox/categories", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const [emails, dms] = await Promise.all([
      prisma.inboundEmail.findMany({
        where: { userId, categories: { isEmpty: false } },
        take: 100,
      }),
      prisma.inboxMessage.findMany({
        where: { userId },
        take: 100,
      }),
    ]);

    const categories: Record<string, any[]> = {
      deals: [],
      negotiations: [],
      gifting: [],
      invites: [],
      vip: [],
      urgent: [],
      spam: [],
    };

    // Process emails
    for (const email of emails) {
      for (const category of email.categories) {
        if (categories[category]) {
          categories[category].push(email);
        }
      }
    }

    // Process DMs
    for (const dm of dms) {
      // InboxMessage doesn't have classifications, so we skip categorization for now
      // This could be enhanced by analyzing the subject/snippet
    }

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Failed to fetch inbox categories:", error);
    res.status(500).json({ success: false, error: "Could not load categories." });
  }
});

export default router;