import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { negotiationQueue } from '../worker/queues/negotiationQueues.js';

/**
 * Cron job to find active negotiation threads awaiting a reply and enqueue them.
 */
async function negotiationAutoResponder() {
  console.log('[CRON] Checking for negotiation threads needing a reply...');
  const threadsToReply = await prisma.negotiationThread.findMany({
    where: { status: 'active' /* Add logic for awaiting reply */ },
  });

  for (const thread of threadsToReply) {
    await negotiationQueue.add('auto-respond', { threadId: thread.id });
  }
}

cron.schedule('*/15 * * * *', negotiationAutoResponder); // Every 15 minutes