import type { Job } from 'bullmq';
import { autoBuildContentPlan } from '../../services/ai/aiContentPlannerService.js';

/**
 * Worker to run the AI content plan generation pipeline.
 */
export default async function contentPlanProcessor(job: Job<{ conceptId: string }>) {
  const { conceptId } = job.data;
  console.log(`[WORKER] Building content plan for concept: ${conceptId}`);
  await autoBuildContentPlan(conceptId).catch(err => {
    console.error(`[WORKER ERROR] Content plan generation failed for concept ${conceptId}:`, err);
    throw err;
  });
}