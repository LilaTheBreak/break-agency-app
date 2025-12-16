import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { competitorScrapeQueue } from '../worker/queues/competitorQueues.js';

/**
 * Cron job to trigger a daily scrape for all tracked competitors.
 */
async function dailyCompetitorSync() {
  console.log('[CRON] Enqueuing daily competitor post sync...');
  const competitorProfiles = await prisma.competitorProfile.findMany();

  for (const profile of competitorProfiles) {
    await competitorScrapeQueue.add('daily-sync', { competitorProfileId: profile.id });
  }
}

// Schedule to run once daily at 5 AM
cron.schedule('0 5 * * *', dailyCompetitorSync);