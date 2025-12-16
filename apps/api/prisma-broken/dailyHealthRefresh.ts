import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { healthInputQueue } from '../worker/queues/healthQueues.js';

/**
 * Cron job to enqueue a daily health check for all active talents.
 */
async function dailyHealthRefresh() {
  console.log('[CRON] Enqueuing daily health checks for all talents...');
  const activeTalents = await prisma.talent.findMany({
    where: { user: { status: 'active' } },
  });

  for (const talent of activeTalents) {
    await healthInputQueue.add('run-health-check', { userId: talent.userId, talentId: talent.id });
  }
}

// Schedule to run once daily at 4 AM
cron.schedule('0 4 * * *', dailyHealthRefresh);