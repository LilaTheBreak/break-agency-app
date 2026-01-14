import cron from "node-cron";
// @ts-ignore - Module resolution issue
import prisma from '../lib/prisma.js';

// This is a placeholder for a real reminder service.
// In a production app, you would use a proper job queue.

/**
 * Schedules a cron job to check for upcoming deliverable deadlines and send reminders.
 */
export function startDeliverableReminders() {
  // Run every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("Checking for deliverable reminders...");

    const upcoming = await prisma.deliverable.findMany({
      where: {
        dueAt: { 
          gte: new Date(), 
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        },
        // Note: Deliverable model doesn't have a status field
      }
    });

    upcoming.forEach((deliverable) => {
      console.log(`[Reminder] Deliverable "${deliverable.title}" due on ${deliverable.dueAt}`);
      // In a real implementation, you would send a Slack/email reminder here.
    });
  });

  console.log("Deliverable reminder service started.");
}