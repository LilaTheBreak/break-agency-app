import { Router } from "express";
import prisma from '../lib/prisma.js';
import { isAdminRequest } from '../lib/auditLogger.js';
import { logError } from '../lib/logger.js';

const router = Router();

/**
 * GET /api/activity - Get recent activity logs (backwards compatible endpoint)
 * Frontend expects this endpoint; routes to admin activity
 */
router.get("/activity", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    
    // Fetch recent audit logs
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity"
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true
      }
    });
    
    // Return as array (frontend expects array, not object wrapper)
    return res.json(logs);
  } catch (error) {
    logError("[/api/activity] Failed to fetch activity", error, { userId: (req as any).user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch activity logs",
      errorCode: "ACTIVITY_FETCH_FAILED"
    });
  }
});

/**
 * GET /api/admin/activity - Get admin activity logs
 */
router.get("/admin/activity", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
    
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity"
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    
    return res.json({ activities: logs });
  } catch (error) {
    logError("[/api/admin/activity] Failed to fetch admin activity", error, { userId: (req as any).user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch activity logs",
      errorCode: "ACTIVITY_FETCH_FAILED"
    });
  }
});

/**
 * GET /api/admin/activity/live - Get live activity updates
 */
router.get("/admin/activity/live", async (req, res) => {
  try {
    if (!isAdminRequest(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const since = req.query.since ? new Date(String(req.query.since)) : null;
    
    const query = prisma.auditLog.findMany({
      where: {
        entityType: "AdminActivity",
        ...(since ? { createdAt: { gt: since } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    
    const activities = await query;
    return res.json({ activities });
  } catch (error) {
    logError("[/api/admin/activity/live] Failed to fetch live activity", error, { userId: (req as any).user?.id });
    return res.status(500).json({ 
      error: "Failed to fetch live activity",
      errorCode: "ACTIVITY_LIVE_FETCH_FAILED"
    });
  }
});

export default router;
