import type { Job } from 'bullmq';
import { analyseDeal } from '../../services/ai/dealReview/dealReviewService.js';

/**
 * Worker to run the full deal review pipeline.
 */
export default async function dealReviewProcessor(job: Job<{ dealThreadId: string }>) {
  const { dealThreadId } = job.data;
  console.log(`[WORKER] Running full deal review for thread: ${dealThreadId}`);
  await analyseDeal(dealThreadId).catch(err => {
    console.error(`[WORKER ERROR] Deal review failed for thread ${dealThreadId}:`, err);
    throw err;
  });
}