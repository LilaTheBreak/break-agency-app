import cron from "node-cron";
import { processEmailQueue } from '../services/emailService';
import { logInfo } from '../lib/logger';

export function registerEmailQueueJob() {
  cron.schedule(
    "*/2 * * * * *",
    async () => {
      await processEmailQueue(20);
    },
    {
      timezone: process.env.TZ || "UTC"
    }
  );

  logInfo("Email queue job registered");
}
