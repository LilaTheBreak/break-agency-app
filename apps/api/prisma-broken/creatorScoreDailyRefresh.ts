import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { creatorScoreMarketFitQueue } from '../worker/queues/creatorScoreQueues.js';

/**
 * Cron job to enqueue a daily score refresh for all active talents.
 */
async function creatorScoreDailyRefresh() {
  console.log('[CRON] Enqueuing daily score refresh for all talents...');
  const activeTalents = await prisma.talent.findMany({
    where: { user: { status: 'active' } },
  });

  for (const talent of activeTalents) {
    await creatorScoreMarketFitQueue.add('refresh-score', { talentId: talent.id });
  }
}

// Schedule to run once daily at 1 AM
cron.schedule('0 1 * * *', creatorScoreDailyRefresh);