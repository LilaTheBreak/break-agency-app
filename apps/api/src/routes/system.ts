import { Router } from "express";
import prisma from '../lib/prisma';
import { CRON_JOBS } from '../cron/index';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(requireRole(["admin"]));

router.get("/system/cron", async (_req, res) => {
  const jobsWithStatus = await Promise.all(
    CRON_JOBS.map(async (job) => {
      // Note: cronLog model doesn't exist - using AuditLog instead
      const lastRunLog = await prisma.auditLog.findFirst({
        where: {
          entityType: "CronJob",
          metadata: {
            path: ["name"],
            equals: job.name
          }
        },
        orderBy: { createdAt: "desc" }
      });
      const lastRun = lastRunLog ? {
        id: lastRunLog.id,
        name: job.name,
        status: (lastRunLog.metadata as any)?.status || "unknown",
        startedAt: (lastRunLog.metadata as any)?.startedAt || lastRunLog.createdAt,
        completedAt: (lastRunLog.metadata as any)?.completedAt || null,
        message: (lastRunLog.metadata as any)?.message || null
      } : null;
      return {
        name: job.name,
        schedule: job.schedule,
        description: job.description,
        lastRun
      };
    })
  );
  res.json({ jobs: jobsWithStatus });
});

router.get("/system/cron/:name/logs", async (req, res) => {
  const name = req.params.name;
  const jobExists = CRON_JOBS.some((job) => job.name === name);
  if (!jobExists) {
    return res.status(404).json({ error: "Cron job not found" });
  }
  // Note: cronLog model doesn't exist - using AuditLog instead
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "CronJob",
      metadata: {
        path: ["name"],
        equals: name
      }
    },
    orderBy: { createdAt: "desc" },
    take: 25
  });
  // Transform to match expected format
  const logs = auditLogs.map(log => ({
    id: log.id,
    name,
    status: (log.metadata as any)?.status || "unknown",
    startedAt: (log.metadata as any)?.startedAt || log.createdAt,
    completedAt: (log.metadata as any)?.completedAt || null,
    message: (log.metadata as any)?.message || null,
    metadata: log.metadata
  }));
  res.json({ name, logs });
});

export default router;
