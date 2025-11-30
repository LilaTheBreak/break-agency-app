import type { Job } from 'bullmq';
import { generateNegotiationInsights } from '../../services/ai/negotiationEngine.js';

interface NegotiationInsightJobData {
  draftId: string;
}

/**
 * Worker process for generating negotiation insights for a deal draft.
 */
export default async function negotiationInsightWorker(job: Job<NegotiationInsightJobData>) {
  const { draftId } = job.data;
  console.log(`[WORKER] Generating negotiation insights for draft: ${draftId}`);

  try {
    await generateNegotiationInsights(draftId);
  } catch (error) {
    console.error(`[WORKER ERROR] Insight generation failed for draft ${draftId}:`, error);
    throw error; // Allow BullMQ to handle retries
  }
}