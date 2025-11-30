import type { Job } from 'bullmq';
import { runNegotiationChain } from '../../services/negotiation/chainEngine.js';

/**
 * Worker to run a single turn of the negotiation chain.
 */
export default async function negotiationChainWorker(job: Job<{ threadId: string }>) {
  const { threadId } = job.data;
  console.log(`[WORKER] Running negotiation chain for thread: ${threadId}`);
  await runNegotiationChain(threadId).catch(err => {
    console.error(`[WORKER ERROR] Negotiation chain failed for thread ${threadId}:`, err);
    throw err;
  });
}