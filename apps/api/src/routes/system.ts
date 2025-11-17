import { Router } from "express";
import prisma from "../lib/prisma.js";
import { CRON_JOBS } from "../cron/index.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.use(requireRole(["admin"]));

router.get("/system/cron", async (_req, res) => {
  const jobsWithStatus = await Promise.all(
    CRON_JOBS.map(async (job) => {
      const lastRun = await prisma.cronLog.findFirst({
        where: { name: job.name },
        orderBy: { startedAt: "desc" }
      });
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
  const logs = await prisma.cronLog.findMany({
    where: { name },
    orderBy: { startedAt: "desc" },
    take: 25
  });
  res.json({ name, logs });
});

export default router;
