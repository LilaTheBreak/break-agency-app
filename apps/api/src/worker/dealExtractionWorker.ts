import type { Job } from 'bullmq';
import { reconstructDealDraft } from '../../services/ai/dealReconstruction';

interface DealExtractionJobData {
  emailId: string;
  threadId?: string;
}

/**
 * Worker process for reconstructing a deal from an email.
 */
export default async function dealExtractionWorker(job: Job<DealExtractionJobData>) {
  const { emailId, threadId } = job.data;
  console.log(`[WORKER] Running deal reconstruction for email: ${emailId}`);

  try {
    await reconstructDealDraft({ emailId, threadId });
  } catch (error) {
    console.error(`[WORKER ERROR] Deal reconstruction failed for email ${emailId}:`, error);
    throw error; // Allow BullMQ to handle the retry
  }
}