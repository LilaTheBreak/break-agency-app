import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

const router = Router();

// Phase 4: Use requireRole instead of manual check, fail loudly on error
router.get("/api/activity", requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const activity = await prisma.adminActivity.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
    });
    res.json(activity);
  } catch (error) {
    // Phase 4: Fail loudly - no empty arrays on error
    logError("Failed to fetch activity feed", error, { userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to fetch activity feed",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;