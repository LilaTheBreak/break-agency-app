import type { Job } from 'bullmq';
import { handleBrandReply } from '../../services/ai/aiRealTimeNegotiationService.js';

/**
 * Worker to process incoming brand replies for active negotiations.
 */
export default async function aiNegotiationWorker(job: Job<{ sessionId: string; brandReplyBody: string }>) {
  const { sessionId, brandReplyBody } = job.data;
  console.log(`[WORKER] Handling brand reply for session: ${sessionId}`);
  await handleBrandReply(sessionId, brandReplyBody).catch(err => {
    console.error(`[WORKER ERROR] Real-time negotiation failed for session ${sessionId}:`, err);
    throw err;
  });
}