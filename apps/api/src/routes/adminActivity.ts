import { Router } from "express";
import prisma from "../lib/prisma.js";
import { isAdminRequest } from "../lib/auditLogger.js";

const router = Router();

router.get("/admin/activity", async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
  const logs = await prisma.adminActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit
  });
  res.json({ activities: logs });
});

router.get("/admin/activity/live", async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const query = prisma.adminActivity.findMany({
    where: since ? { createdAt: { gt: since } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const activities = await query;
  res.json({ activities });
});

export default router;
