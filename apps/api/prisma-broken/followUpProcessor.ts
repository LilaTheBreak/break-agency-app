import type { Job } from 'bullmq';
import { runFollowUpJob } from '../../services/followUp/followUpService.js';

/**
 * Worker to run the AI follow-up pipeline for a deliverable.
 */
export default async function followUpProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running follow-up check for deliverable: ${deliverableId}`);
  await runFollowUpJob(deliverableId).catch(err => {
    console.error(`[WORKER ERROR] Follow-up job failed for deliverable ${deliverableId}:`, err);
    throw err;
  });
}