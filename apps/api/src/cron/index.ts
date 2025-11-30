import { CronJobDefinition, runCronJob, TIMEZONE } from "./types.js";
import { checkOverdueInvoicesJob } from "./checkOverdueInvoices.js";
import { sendDailyBriefDigestJob } from "./sendDailyBriefDigest.js";
import { updateSocialStatsJob } from "./updateSocialStats.js";
import { flushStaleApprovalsJob } from "./flushStaleApprovals.js";
import { dealAutomationJob } from "./dealAutomationJob.js";
import { dealCleanupJob } from "./dealCleanupJob.js";
import { generateWeeklyReports } from "../jobs/weeklyReports.js";
import { recoverAIAgentTasks } from "./aiAgentRecovery.js";
import { runOutreachRotation } from "./outreachRotation.js";
import { logInfo } from "../lib/logger.js";
import { aiAgentQueue } from "../worker/queues.js";
import prisma from "../lib/prisma.js";
import { enqueueAIAgentTask } from "../services/aiAgent/aiAgentQueue.js";
import { buildOutreachPlan } from "../services/aiAgent/outreachPrioritiser.js";
import { outreachQueue, deliverableQueue } from "../worker/queues.js";
import cron from "node-cron";
import { generateFollowUps } from "./outreachFollowUps.js";
import { recalcBrandCRM } from "./brandRescoreDaily.js";
import { strategyQueue } from "../worker/queues.js";
import { syncInstagram } from "../services/channels/instagramSync.js";
import { syncWhatsApp } from "../services/channels/whatsappSync.js";

export const CRON_JOBS: CronJobDefinition[] = [
  checkOverdueInvoicesJob,
  sendDailyBriefDigestJob,
  updateSocialStatsJob,
  flushStaleApprovalsJob,
  dealAutomationJob,
  dealCleanupJob
];

function registerDeliverableCron() {
  cron.schedule("0 * * * *", async () => {
    const overdue = await prisma.deliverable.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: "delivered" }
      }
    });

    for (const item of overdue) {
      await deliverableQueue.add("deliverable-overdue", { deliverableId: item.id });
    }
  });
}

export function registerCronJobs() {
  CRON_JOBS.forEach((job) => {
    cron.schedule(job.schedule, () => runCronJob(job), { timezone: TIMEZONE });
  });
  logInfo("Registered cron jobs", { count: CRON_JOBS.length });
  registerDeliverableCron();
  cron.schedule("0 8 * * 1", () => generateWeeklyReports());
  cron.schedule("*/10 * * * *", async () => {
    try {
      await recoverAIAgentTasks();
    } catch (err) {
      console.error("AI agent recovery failed", err);
    }
  });
  cron.schedule("0 8 * * 2", async () => {
    try {
      await runOutreachRotation();
    } catch (err) {
      console.error("Outreach rotation failed", err);
    }
  });
  cron.schedule("*/30 * * * *", async () => {
    try {
      if (typeof aiAgentQueue.getFailed === "function") {
        const failed = await aiAgentQueue.getFailed();
        for (const job of failed) {
          await job.retry().catch(() => null);
        }
      }
    } catch (err) {
      console.error("AI agent queue retry failed", err);
    }
  });
  cron.schedule("0 9 * * 1", async () => {
    try {
      const users = await prisma.user.findMany({
        where: { status: "active" },
        select: { id: true }
      });
      for (const u of users) {
        await enqueueAIAgentTask({
          type: "OUTREACH",
          userId: u.id
        });
      }
    } catch (err) {
      console.error("AI agent weekly outreach failed", err);
    }
  });
  cron.schedule("0 9 * * *", async () => {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      const plan = await buildOutreachPlan(user.id);
      for (const p of plan) {
        await outreachQueue.add("outreach", {
          userId: user.id,
          outreachPlanId: p.id,
          dryRun: false
        });
      }
    }
  });
  cron.schedule("0 */6 * * *", async () => {
    await generateFollowUps().catch((err) => console.error("Outreach follow-up cron failed", err));
  });
  cron.schedule("0 3 * * *", async () => {
    await recalcBrandCRM().catch((err) => console.error("Brand CRM daily cron failed", err));
  });
  cron.schedule("0 4 * * *", async () => {
    const brands = await prisma.brandRelationship.findMany();
    for (const b of brands) {
      await strategyQueue.add("predict", { userId: b.userId, brandName: b.brandName });
    }
  });
  cron.schedule("*/10 * * * *", async () => {
    try {
      await syncInstagram();
    } catch (err) {
      console.error("Instagram DM sync failed", err);
    }
  });
  cron.schedule("*/10 * * * *", async () => {
    try {
      await syncWhatsApp();
    } catch (err) {
      console.error("WhatsApp sync failed", err);
    }
  });
}
