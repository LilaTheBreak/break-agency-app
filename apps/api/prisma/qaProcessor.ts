import type { Job } from 'bullmq';
import { reviewDeliverable } from '../../services/ai/aiQAService.js';

/**
 * Worker to run the AI QA pipeline for a deliverable.
 */
export default async function qaProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running AI QA for deliverable: ${deliverableId}`);
  await reviewDeliverable(deliverableId).catch(err => {
    console.error(`[WORKER ERROR] AI QA failed for deliverable ${deliverableId}:`, err);
    throw err;
  });
}