import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { sendList, sendEmptyList } from "../utils/apiResponse.js";
import * as Sentry from "@sentry/node";

const router = Router();

// Phase 4: Use requireRole instead of manual check, fail loudly on error
router.get("/api/activity", requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 100);

    // Query activity without include to avoid relation errors
    const activity = await prisma.adminActivity.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Manually fetch user data if actorId exists (defensive approach)
    const activityWithUsers = await Promise.all(
      activity.map(async (item: any) => {
        if (item.actorId) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: item.actorId },
              select: { name: true, avatarUrl: true },
            });
            return { ...item, user: user || null };
          } catch {
            return { ...item, user: null };
          }
        }
        return { ...item, user: null };
      })
    );

    sendList(res, activityWithUsers || []);
  } catch (error) {
    // Graceful degradation: return empty array instead of 500
    logError("Failed to fetch activity feed", error, { userId: req.user?.id });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/activity', method: 'GET' },
    });
    sendEmptyList(res);
  }
});

export default router;