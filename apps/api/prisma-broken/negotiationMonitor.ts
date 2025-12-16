import cron from 'node-cron';

/**
 * Cron job to monitor ongoing negotiations and flag stalled threads.
 * This is a stub for the full implementation.
 */
async function monitorNegotiations() {
  console.log('[CRON] Monitoring ongoing negotiations...');
  // 1. Find all active negotiation threads
  // 2. Check `lastBrandMessageAt` and `lastAIAgentMessageAt`
  // 3. If a thread is stalled, enqueue a job in the `negotiationFollowUp` queue
}

cron.schedule('0 */4 * * *', monitorNegotiations); // Every 4 hours