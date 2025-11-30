import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { dealForecastQueue } from '../worker/queues/dealForecastQueue.js';

/**
 * Cron job to re-calculate forecasts for all active deals.
 */
async function refreshDealForecasts() {
  console.log('[CRON] Refreshing forecasts for all active deals...');
  const activeDeals = await prisma.dealThread.findMany({
    where: { status: 'open' },
  });

  for (const deal of activeDeals) {
    await dealForecastQueue.add('refresh-forecast', { dealId: deal.id });
  }
}

// Schedule to run every 6 hours
cron.schedule('0 */6 * * *', refreshDealForecasts);