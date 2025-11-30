import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { negotiationAutoPilotQueue } from '../worker/queues/negotiationAutoPilotQueue.js';

/**
 * Cron job to find active negotiation threads awaiting a reply and enqueue them for the auto-pilot.
 */
async function negotiationAutoResponderCron() {
  console.log('[CRON] Checking for negotiation threads needing an auto-pilot response...');
  const threadsToReply = await prisma.negotiationThread.findMany({
    where: {
      status: 'active',
      // Logic to determine if it's the AI's turn to reply
      // e.g., lastAIAgentMessageAt < lastBrandMessageAt
    },
  });

  for (const thread of threadsToReply) {
    await negotiationAutoPilotQueue.add('auto-respond', { threadId: thread.id });
  }
}

cron.schedule('*/5 * * * *', negotiationAutoResponderCron); // Every 5 minutes