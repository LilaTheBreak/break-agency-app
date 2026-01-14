import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import { fetchPriorityFeed } from '../services/inboxPriorityService.js';

const router = Router();

/**
 * GET /api/inbox/priority-feed
 * Returns a prioritized list of all inbox items for the current user.
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const priorityFeed = await fetchPriorityFeed(userId);

    res.json({
      ok: true,
      count: priorityFeed.length,
      data: priorityFeed,
    });
  } catch (error) {
    console.error("Failed to fetch priority feed:", error);
    res.status(500).json({ ok: false, error: "Could not load priority feed." });
  }
});

export default router;