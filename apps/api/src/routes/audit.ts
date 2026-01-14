import { Router } from "express";
import prisma from '../lib/prisma';
import { isAdminRequest, logAuditEvent } from '../lib/auditLogger';

const router = Router();

router.get("/audit", async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ 
      error: "Admin access required",
      logs: [], 
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } 
    });
  }

  // Log that admin viewed audit logs (self-audit)
  await logAuditEvent(req, {
    action: "AUDIT_VIEWED",
    entityType: "audit",
    metadata: {
      filters: {
        userId: req.query.userId || null,
        entityType: req.query.entityType || null,
        action: req.query.action || null,
        userRole: req.query.userRole || null,
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null
      },
      page: req.query.page || 1
    }
  });

  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const skip = (page - 1) * limit;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const userRole = typeof req.query.userRole === "string" ? req.query.userRole : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (userRole) where.userRole = userRole;
  
  // Add date range filtering
  if (startDate || endDate) {
    const createdAtFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      createdAtFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      createdAtFilter.lte = end;
    }
    (where as any).createdAt = createdAtFilter;
  }

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
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      },
      filters: {
        userId,
        entityType,
        action,
        userRole,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to load audit logs. Please refresh or contact support.",
      logs: [], 
      pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } 
    });
  }
});

// GET /audit/export - Export audit logs as CSV
router.get("/audit/export", async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  // Log the export action (self-audit)
  await logAuditEvent(req, {
    action: "AUDIT_EXPORTED",
    entityType: "audit",
    metadata: {
      filters: {
        userId: req.query.userId || null,
        entityType: req.query.entityType || null,
        action: req.query.action || null,
        userRole: req.query.userRole || null,
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null
      }
    }
  });

  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  const userRole = typeof req.query.userRole === "string" ? req.query.userRole : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (userRole) where.userRole = userRole;
  
  if (startDate || endDate) {
    const createdAtFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      createdAtFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      createdAtFilter.lte = end;
    }
    (where as any).createdAt = createdAtFilter;
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit export to 10k records for performance
      include: {
        User: {
          select: {
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Build CSV content
    const headers = "Timestamp,User Email,User Name,User Role,Action,Entity Type,Entity ID,IP Address,Metadata\n";
    const rows = logs.map(log => {
      const timestamp = log.createdAt.toISOString();
      const email = log.User?.email || "N/A";
      const name = log.User?.name || "N/A";
      const role = log.userRole || "N/A";
      const actionName = log.action;
      const entity = log.entityType || "N/A";
      const entityId = log.entityId || "N/A";
      const ip = log.ipAddress || "N/A";
      const metadata = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : "N/A";
      
      return `"${timestamp}","${email}","${name}","${role}","${actionName}","${entity}","${entityId}","${ip}","${metadata}"`;
    }).join("\n");

    const csv = headers + rows;
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Audit export error:", error);
    res.status(500).json({ error: "Failed to export audit logs" });
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
