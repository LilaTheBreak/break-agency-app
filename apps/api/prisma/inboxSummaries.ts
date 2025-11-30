import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { inboxSummaryQueue } from '../worker/queues/inboxSummaryQueue.js';

/**
 * Cron job to enqueue inbox summary tasks for all active users.
 */
async function enqueueInboxSummaries() {
  console.log('[CRON] Enqueuing inbox summary jobs...');
  const users = await prisma.user.findMany({ where: { status: 'active' } });

  for (const user of users) {
    // Enqueue a daily summary job
    await inboxSummaryQueue.add('generate-daily-summary', { userId: user.id, timeframe: 'daily' });
  }
}

// Schedule to run once daily at 8 AM
cron.schedule('0 8 * * *', enqueueInboxSummaries);

// You could add another schedule here for hourly runs if needed.