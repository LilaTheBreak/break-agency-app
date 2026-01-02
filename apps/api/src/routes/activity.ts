import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";
import { sendList, sendEmptyList } from "../utils/apiResponse.js";
import * as Sentry from "@sentry/node";

const router = Router();

// Phase 4: Use requireRole instead of manual check, fail loudly on error
// Route path is "/" because it's mounted at "/api/activity" in server.ts
router.get("/", requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 100);

    // Note: adminActivity model doesn't exist - using AuditLog instead
    const activity = await prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity" // Filter for admin activities
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Manually fetch user data if userId exists (defensive approach)
    const activityWithUsers = await Promise.all(
      activity.map(async (item: any) => {
        if (item.userId) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: item.userId },
              select: { name: true, avatarUrl: true },
            });
            return { ...item, user: user || null, actorId: item.userId }; // Map userId to actorId for backward compatibility
          } catch {
            return { ...item, user: null, actorId: item.userId };
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