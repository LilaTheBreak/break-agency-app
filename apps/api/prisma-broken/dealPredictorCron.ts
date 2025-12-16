import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { runDealPrediction } from '../pipelines/dealPredictionPipeline.js';

/**
 * Cron job to re-score all active deals.
 */
async function reScoreActiveDeals() {
  console.log('[CRON] Running deal predictor for all active deals...');
  const activeDeals = await prisma.dealThread.findMany({
    where: { status: 'open' },
  });

  for (const deal of activeDeals) {
    await runDealPrediction(deal.id).catch(err =>
      console.error(`[CRON] Failed to predict deal ${deal.id}:`, err)
    );
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', reScoreActiveDeals);