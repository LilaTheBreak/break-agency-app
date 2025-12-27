import { Router } from "express";
import prisma from "../lib/prisma.js";
import { isAdminRequest } from "../lib/auditLogger.js";

const router = Router();

router.get("/audit", async (req, res) => {
  if (!isAdminRequest(req)) {
    // Return empty logs instead of 403 - allow graceful degradation
    return res.status(200).json({ 
      logs: [], 
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } 
    });
  }

  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const skip = (page - 1) * limit;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const userRole = typeof req.query.userRole === "string" ? req.query.userRole : undefined;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (userRole) where.userRole = userRole;

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          User: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    // Return empty logs on error - don't crash dashboard
    res.status(200).json({ 
      logs: [], 
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } 
    });
  }
});

// GET /audit/superadmin - Get SUPERADMIN-specific audit logs
router.get("/audit/superadmin", async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 500);
    
    const logs = await prisma.auditLog.findMany({
      where: {
        userRole: "SUPERADMIN"
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json({ logs, total: logs.length });
  } catch (error) {
    console.error("SUPERADMIN audit logs error:", error);
    res.status(500).json({ error: "Failed to fetch SUPERADMIN audit logs" });
  }
});

// GET /audit/stats - Get audit statistics
router.get("/audit/stats", async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const [
      totalLogs,
      superadminLogs,
      destructiveLogs,
      authLogs,
      recentSuperadminLogins
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { userRole: "SUPERADMIN" } }),
      prisma.auditLog.count({ where: { action: { startsWith: "DESTRUCTIVE_" } } }),
      prisma.auditLog.count({ where: { action: { startsWith: "AUTH_" } } }),
      prisma.auditLog.findMany({
        where: {
          userRole: "SUPERADMIN",
          action: { startsWith: "AUTH_SUPERADMIN_LOGIN" }
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          User: {
            select: { email: true, name: true }
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalLogs,
        superadminLogs,
        destructiveLogs,
        authLogs
      },
      recentSuperadminLogins
    });
  } catch (error) {
    console.error("Audit stats error:", error);
    res.status(500).json({ error: "Failed to fetch audit statistics" });
  }
});

export default router;
