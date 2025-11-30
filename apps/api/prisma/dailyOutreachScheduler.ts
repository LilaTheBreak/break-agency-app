import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { outreachInputQueue } from '../worker/queues/outreachQueues.js';

/**
 * Cron job to find new leads and enqueue them for outreach generation.
 */
async function scheduleDailyOutreach() {
  console.log('[CRON] Scheduling daily outreach generation...');
  const newLeads = await prisma.lead.findMany({
    where: { status: 'new' },
  });

  for (const lead of newLeads) {
    await outreachInputQueue.add('generate-outreach', { leadId: lead.id, userId: lead.userId });
  }
}

// Schedule to run once daily at 7 AM
cron.schedule('0 7 * * *', scheduleDailyOutreach);