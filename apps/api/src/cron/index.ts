import cron from "node-cron";
import { CronJobDefinition, runCronJob, TIMEZONE } from "./types.js";
import { checkOverdueInvoicesJob } from "./checkOverdueInvoices.js";
import { sendDailyBriefDigestJob } from "./sendDailyBriefDigest.js";
import { updateSocialStatsJob } from "./updateSocialStats.js";
import { flushStaleApprovalsJob } from "./flushStaleApprovals.js";
import { logInfo } from "../lib/logger.js";

export const CRON_JOBS: CronJobDefinition[] = [
  checkOverdueInvoicesJob,
  sendDailyBriefDigestJob,
  updateSocialStatsJob,
  flushStaleApprovalsJob
];

export function registerCronJobs() {
  CRON_JOBS.forEach((job) => {
    cron.schedule(job.schedule, () => runCronJob(job), { timezone: TIMEZONE });
  });
  logInfo("Registered cron jobs", { count: CRON_JOBS.length });
}
