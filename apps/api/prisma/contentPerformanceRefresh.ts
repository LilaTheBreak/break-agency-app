import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { contentPerformanceQueue } from '../worker/queues/contentPerformanceQueue.js';

/**
 * Cron job to re-run forecasting for all upcoming deliverables.
 */
async function refreshContentForecasts() {
  console.log('[CRON] Refreshing performance forecasts for upcoming deliverables...');
  const upcomingDeliverables = await prisma.deliverable.findMany({
    where: { status: { in: ['scheduled', 'in_progress'] }, dueDate: { gte: new Date() } },
  });

  for (const deliverable of upcomingDeliverables) {
    await contentPerformanceQueue.add('refresh-forecast', { deliverableId: deliverable.id });
  }
}

// Schedule to run once daily
cron.schedule('0 3 * * *', refreshContentForecasts); // Run at 3 AM daily