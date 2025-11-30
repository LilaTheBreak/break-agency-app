import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { aiSilenceWorkerQueue } from '../worker/queues/aiNegotiationQueues.js';

const SILENCE_THRESHOLD_HOURS = 48;

/**
 * Cron job to find threads that have gone silent and enqueue them for follow-up.
 */
async function checkforSilentThreads() {
  console.log('[CRON] Checking for silent negotiation threads...');
  const threshold = new Date(Date.now() - SILENCE_THRESHOLD_HOURS * 3600 * 1000);

  const silentThreads = await prisma.negotiationThread.findMany({
    where: { status: 'active', lastBrandMessageAt: { lt: threshold }, lastAIAgentMessageAt: { lt: threshold } },
  });

  for (const thread of silentThreads) {
    await aiSilenceWorkerQueue.add('handle-silence', { threadId: thread.id });
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', checkforSilentThreads);