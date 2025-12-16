import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { deadlineGuardQueue } from '../worker/queues/deadlineGuardQueue.js';

/**
 * Cron job to find active deadlines that need checking and enqueue them.
 */
async function enqueueDueDeadlines() {
  console.log('[CRON] Checking for deadlines to monitor...');
  const dueDeadlines = await prisma.deadlineMonitor.findMany({
    where: { status: 'active', dueAt: { gte: new Date() } },
    // In a real app, you'd add more logic here to check `lastChecked`
    // to avoid re-checking too frequently.
  });

  for (const deadline of dueDeadlines) {
    await deadlineGuardQueue.add('check-deadline', { deadlineId: deadline.id });
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', enqueueDueDeadlines);