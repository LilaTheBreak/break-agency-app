import type { Job } from 'bullmq';
import { autoScheduleDeal } from '../../services/scheduling/deliverableAutoScheduler.js';

/**
 * Worker to run the auto-scheduling pipeline for a deal.
 */
export default async function schedulingProcessor(job: Job<{ dealId: string }>) {
  const { dealId } = job.data;
  console.log(`[WORKER] Auto-scheduling campaign for deal: ${dealId}`);
  await autoScheduleDeal(dealId).catch(err => {
    console.error(`[WORKER ERROR] Auto-scheduling failed for deal ${dealId}:`, err);
    throw err;
  });
}