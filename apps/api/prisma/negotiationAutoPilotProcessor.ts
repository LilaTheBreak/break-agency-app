import type { Job } from 'bullmq';
import { runAutoPilotForThread } from '../../agent/negotiation/autoPilot.js';

/**
 * Worker to run the AI Negotiation Auto-Pilot pipeline.
 */
export default async function negotiationAutoPilotProcessor(job: Job<{ threadId: string }>) {
  const { threadId } = job.data;
  console.log(`[WORKER] Running negotiation auto-pilot for thread: ${threadId}`);
  await runAutoPilotForThread(threadId).catch(err => {
    console.error(`[WORKER ERROR] Negotiation auto-pilot failed for thread ${threadId}:`, err);
    throw err;
  });
}