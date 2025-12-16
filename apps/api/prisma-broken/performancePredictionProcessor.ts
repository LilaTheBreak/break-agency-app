import type { Job } from 'bullmq';
import { predictDeliverablePerformance } from '../../services/ai/aiPerformancePredictionService.js';

/**
 * Worker to run the AI performance prediction pipeline for a deliverable.
 */
export default async function performancePredictionProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running performance prediction for deliverable: ${deliverableId}`);
  await predictDeliverablePerformance(deliverableId).catch(err => {
    console.error(`[WORKER ERROR] Performance prediction failed for deliverable ${deliverableId}:`, err);
    throw err;
  });
}