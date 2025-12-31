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
    try {
      console.log("[CRON] Starting deliverable overdue check...");
      const overdue = await prisma.deliverable.findMany({
        where: {
          dueAt: { lt: new Date() },
          // Note: Deliverable model doesn't have a status field, filtering by dueAt only
        }
      });

      let queued = 0;
      for (const item of overdue) {
        await deliverableQueue.add("deliverable-overdue", { deliverableId: item.id });
        queued++;
      }
      console.log(`[CRON] Deliverable overdue check completed: ${queued} overdue items queued`);
    } catch (err) {
      console.error("[CRON] Deliverable overdue check failed:", err);
      throw err; // Phase 3: Fail loudly
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
    cron.schedule("0 8 * * 1", async () => {
      try {
        console.log("[CRON] Starting weekly reports generation...");
        await generateWeeklyReports();
        console.log("[CRON] Weekly reports generation completed");
      } catch (err) {
        console.error("[CRON] Weekly reports generation failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // AI agent recovery (every 10 mins)
    cron.schedule("*/10 * * * *", async () => {
      try {
        console.log("[CRON] Starting AI agent recovery...");
        const result = await recoverAIAgentTasks();
        console.log(`[CRON] AI agent recovery completed: ${result.recovered} tasks recovered`);
      } catch (err) {
        console.error("[CRON] AI agent recovery failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Outreach rotation (Tuesdays 8am)
    cron.schedule("0 8 * * 2", async () => {
      try {
        console.log("[CRON] Starting outreach rotation...");
        const result = await runOutreachRotation();
        console.log(`[CRON] Outreach rotation completed: ${result.queued} tasks queued`);
      } catch (err) {
        console.error("[CRON] Outreach rotation failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // AI agent queue retry (every 30 mins)
    cron.schedule("*/30 * * * *", async () => {
      try {
        console.log("[CRON] Starting AI agent queue retry...");
        if (typeof aiAgentQueue.getFailed === "function") {
          const failed = await aiAgentQueue.getFailed();
          let retried = 0;
          for (const job of failed) {
            try {
              await job.retry();
              retried++;
            } catch (retryErr) {
              console.error(`[CRON] Failed to retry job ${job.id}:`, retryErr);
            }
          }
          console.log(`[CRON] AI agent queue retry completed: ${retried}/${failed.length} jobs retried`);
        }
      } catch (err) {
        console.error("[CRON] AI agent queue retry failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Weekly outreach enqueue (Mondays 9am)
    cron.schedule("0 9 * * 1", async () => {
      try {
        console.log("[CRON] Starting weekly outreach enqueue...");
        const users = await prisma.user.findMany({
          where: { status: "active" },
          select: { id: true }
        });
        let enqueued = 0;
        for (const u of users) {
          await enqueueAIAgentTask({
            type: "OUTREACH",
            userId: u.id
          });
          enqueued++;
        }
        console.log(`[CRON] Weekly outreach enqueue completed: ${enqueued} tasks enqueued`);
      } catch (err) {
        console.error("[CRON] AI agent weekly outreach failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Daily outreach plan (9am)
    cron.schedule("0 9 * * *", async () => {
      try {
        console.log("[CRON] Starting daily outreach plan...");
        const users = await prisma.user.findMany({ select: { id: true } });
        let totalQueued = 0;
        for (const user of users) {
          const plan = await buildOutreachPlan(user.id);
          for (const p of plan) {
            await outreachQueue.add("outreach", {
              userId: user.id,
              outreachPlanId: p.id,
              dryRun: false
            });
            totalQueued++;
          }
        }
        console.log(`[CRON] Daily outreach plan completed: ${totalQueued} tasks queued`);
      } catch (err) {
        console.error("[CRON] Daily outreach plan failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Follow-ups (every 6 hours)
    cron.schedule("0 */6 * * *", async () => {
      try {
        console.log("[CRON] Starting outreach follow-ups...");
        await generateFollowUps();
        console.log("[CRON] Outreach follow-ups completed");
      } catch (err) {
        console.error("[CRON] Outreach follow-up cron failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Brand CRM daily (3am)
    cron.schedule("0 3 * * *", async () => {
      try {
        console.log("[CRON] Starting brand CRM daily recalculation...");
        await recalcBrandCRM();
        console.log("[CRON] Brand CRM daily recalculation completed");
      } catch (err) {
        console.error("[CRON] Brand CRM daily cron failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Strategy predictions (4am)
    cron.schedule("0 4 * * *", async () => {
      try {
        console.log("[CRON] Starting strategy predictions...");
        const brands = await prisma.brandRelationship.findMany();
        let queued = 0;
        for (const b of brands) {
          await strategyQueue.add("predict", { userId: b.userId, brandName: b.brandName });
          queued++;
        }
        console.log(`[CRON] Strategy predictions completed: ${queued} predictions queued`);
      } catch (err) {
        console.error("[CRON] Strategy predictions failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });
    
    // Instagram sync (every 10 mins) - DISABLED: social schema models removed
    // cron.schedule("*/10 * * * *", async () => {
    //   try {
    //     await syncInstagram();
    //   } catch (err) {
    //     console.error("Instagram DM sync failed", err);
    //   }
    // });
    
    // WhatsApp sync (every 10 mins)
    cron.schedule("*/10 * * * *", async () => {
      try {
        console.log("[CRON] Starting WhatsApp sync...");
        await syncWhatsApp();
        console.log("[CRON] WhatsApp sync completed");
      } catch (err) {
        console.error("[CRON] WhatsApp sync failed:", err);
        throw err; // Phase 3: Fail loudly
      }
    });

    // Gmail sync (every 15 minutes)
    cron.schedule("*/15 * * * *", async () => {
      try {
        console.log("[CRON] Starting Gmail background sync...");
        const { syncAllUsers } = await import("../services/gmail/backgroundSync.js");
        await syncAllUsers();
        console.log("[CRON] Gmail background sync completed");
      } catch (err) {
        console.error("[CRON] Gmail sync failed", err);
      }
    });

    // Weekly talent reports (Mondays 9am)
    cron.schedule("0 9 * * 1", async () => {
      try {
        console.log("[CRON] Starting weekly talent reports generation...");
        logInfo("Starting weekly report generation job...");
        const usersToReport = await prisma.user.findMany({
          where: { role: { in: ['EXCLUSIVE_TALENT', 'TALENT', 'FOUNDER', 'UGC_CREATOR'] } },
          select: { id: true },
        });

        let enqueued = 0;
        for (const user of usersToReport) {
          await aiAgentQueue.add("WEEKLY_REPORT", { userId: user.id });
          enqueued++;
        }
        console.log(`[CRON] Weekly talent reports completed: ${enqueued} reports enqueued`);
      } catch (err) {
        console.error("[CRON] Failed to enqueue weekly reports:", err);
        throw err; // Phase 3: Fail loudly
      }
    }, { timezone: TIMEZONE });
    
    console.log("[CRON] All cron jobs registered successfully");
  } catch (error) {
    console.error("[CRON] Fatal error during cron job registration:", error);
    throw error;
  }
}
