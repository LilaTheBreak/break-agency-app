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

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
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
      pagination: { page, limit, total: 0, totalPages: 1 } 
    });
  }
});

export default router;
