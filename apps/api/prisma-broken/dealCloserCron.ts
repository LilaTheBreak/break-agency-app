import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { runDealCloser } from '../services/ai/dealCloser.js';

/**
 * Cron job to find and close deals that are ready.
 */
async function findAndCloseDeals() {
  console.log('[CRON] Running deal closer radar...');

  // Find threads that have had a positive signal and no activity for a few hours
  const threadsToClose = await prisma.negotiationThread.findMany({
    where: {
      status: 'active',
      // Add more sophisticated logic here to detect "ready to close" state
      lastBrandMessageAt: { lt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    },
  });

  for (const thread of threadsToClose) {
    console.log(`[CRON] Detected thread ${thread.id} as potentially ready to close. Running closer...`);
    await runDealCloser(thread.id).catch(err => console.error(`Failed to close deal for thread ${thread.id}`, err));
  }
}

// Schedule to run every 3 hours
cron.schedule('0 */3 * * *', findAndCloseDeals);