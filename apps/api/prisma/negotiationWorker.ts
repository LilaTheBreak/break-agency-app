import type { Job } from 'bullmq';
import { runAutoNegotiation } from '../../services/negotiation/autoNegotiationAgent.js';

interface NegotiationJobData {
  dealId: string;
}

/**
 * Worker process for running the autonomous negotiation agent.
 */
export default async function negotiationWorker(job: Job<NegotiationJobData>) {
  const { dealId } = job.data;
  console.log(`[WORKER] Running auto-negotiation for deal: ${dealId}`);

  try {
    await runAutoNegotiation(dealId);
  } catch (error) {
    console.error(`[WORKER ERROR] Auto-negotiation failed for deal ${dealId}:`, error);
    throw error;
  }
}