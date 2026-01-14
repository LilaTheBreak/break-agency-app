import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import prisma from '../lib/prisma';
import { logError } from '../lib/logger';
import { sendList, sendEmptyList } from '../utils/apiResponse';
import * as Sentry from "@sentry/node";

const router = Router();

// Phase 4: Use requireRole instead of manual check, fail loudly on error
// Route path is "/" because it's mounted at "/api/activity" in server.ts
router.get("/", requireAuth, requireRole(['ADMIN', 'SUPERADMIN']), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 100);

    // Safety check: ensure limit is a valid number
    if (!Number.isFinite(limit) || limit < 1) {
      return sendList(res, []);
    }

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

    // Ensure activity is always an array
    const safeActivity = Array.isArray(activity) ? activity : [];

    // Manually fetch user data if userId exists (defensive approach)
    const activityWithUsers = await Promise.all(
      safeActivity.map(async (item: any) => {
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

    // Ensure activityWithUsers is always an array before sending
    const safeActivityWithUsers = Array.isArray(activityWithUsers) ? activityWithUsers : [];
    sendList(res, safeActivityWithUsers);
  } catch (error) {
    // Log the error with Prisma error code if available
    logError("Failed to fetch activity feed", error, { userId: req.user?.id, code: (error as any)?.code });
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/activity', method: 'GET', prismaCode: (error as any)?.code },
    });
    // Return empty array instead of 500 - graceful degradation
    // Activity feed is non-critical, should not crash the dashboard
    return sendList(res, []);
  }
});

export default router;