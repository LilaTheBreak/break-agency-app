import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { forecastBuildQueue } from '../worker/queues/forecastQueues.js';

/**
 * Cron job to re-run forecasting for all active deal drafts.
 */
async function refreshCampaignForecasts() {
  console.log('[CRON] Refreshing forecasts for all active deal drafts...');
  const activeDrafts = await prisma.dealDraft.findMany({
    where: { status: 'pending' }, // Or whatever status indicates an active deal
  });

  for (const draft of activeDrafts) {
    await forecastBuildQueue.add('refresh-forecast', { dealDraftId: draft.id });
  }
}

// Schedule to run once daily at 2 AM
cron.schedule('0 2 * * *', refreshCampaignForecasts);