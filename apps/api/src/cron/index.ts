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
  try {
    // Register standard cron jobs
    CRON_JOBS.forEach((job) => {
      try {
        cron.schedule(job.schedule, () => runCronJob(job), { timezone: TIMEZONE });
      } catch (err) {
        console.error(`Failed to register cron job: ${job.name}`, err);
      }
    });
    logInfo("Registered cron jobs", { count: CRON_JOBS.length });
    
    // Register deliverable cron
    try {
      registerDeliverableCron();
    } catch (err) {
      console.error("Failed to register deliverable cron", err);
    }
    
    // Weekly reports
    cron.schedule("0 8 * * 1", () => generateWeeklyReports());
    
    // AI agent recovery (every 10 mins)
    cron.schedule("*/10 * * * *", async () => {
      try {
        await recoverAIAgentTasks();
      } catch (err) {
        console.error("AI agent recovery failed", err);
      }
    });
    
    // Outreach rotation (Tuesdays 8am)
    cron.schedule("0 8 * * 2", async () => {
      try {
        await runOutreachRotation();
      } catch (err) {
        console.error("Outreach rotation failed", err);
      }
    });
    
    // AI agent queue retry (every 30 mins)
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
    
    // Weekly outreach enqueue (Mondays 9am)
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
    
    // Daily outreach plan (9am)
    cron.schedule("0 9 * * *", async () => {
      try {
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
      } catch (err) {
        console.error("Daily outreach plan failed", err);
      }
    });
    
    // Follow-ups (every 6 hours)
    cron.schedule("0 */6 * * *", async () => {
      await generateFollowUps().catch((err) => console.error("Outreach follow-up cron failed", err));
    });
    
    // Brand CRM daily (3am)
    cron.schedule("0 3 * * *", async () => {
      await recalcBrandCRM().catch((err) => console.error("Brand CRM daily cron failed", err));
    });
    
    // Strategy predictions (4am)
    cron.schedule("0 4 * * *", async () => {
      try {
        const brands = await prisma.brandRelationship.findMany();
        for (const b of brands) {
          await strategyQueue.add("predict", { userId: b.userId, brandName: b.brandName });
        }
      } catch (err) {
        console.error("Strategy predictions failed", err);
      }
    });
    
    // Instagram sync (every 10 mins)
    cron.schedule("*/10 * * * *", async () => {
      try {
        await syncInstagram();
      } catch (err) {
        console.error("Instagram DM sync failed", err);
      }
    });
    
    // WhatsApp sync (every 10 mins)
    cron.schedule("*/10 * * * *", async () => {
      try {
        await syncWhatsApp();
      } catch (err) {
        console.error("WhatsApp sync failed", err);
      }
    });

    // Weekly talent reports (Mondays 9am)
    cron.schedule("0 9 * * 1", async () => {
      logInfo("Starting weekly report generation job...");
      try {
        const usersToReport = await prisma.user.findMany({
          where: { role: { in: ['EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'UGC_CREATOR'] } },
          select: { id: true },
        });

        for (const user of usersToReport) {
          await aiAgentQueue.add("WEEKLY_REPORT", { userId: user.id });
        }
      } catch (err) {
        console.error("Failed to enqueue weekly reports:", err);
      }
    }, { timezone: TIMEZONE });
    
    console.log("[CRON] All cron jobs registered successfully");
  } catch (error) {
    console.error("[CRON] Fatal error during cron job registration:", error);
    throw error;
  }
}
