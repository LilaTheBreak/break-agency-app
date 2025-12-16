import type { Job } from 'bullmq';
import { runTalentShortlist } from '../../services/talent/matchEngine.js';
import { budgetPlanQueue } from '../queues/budgetPlanQueue.js';

/**
 * Worker to run the AI talent shortlisting process for a campaign plan.
 */
export default async function creatorMatchWorker(job: Job<{ aiPlanId: string }>) {
  const { aiPlanId } = job.data;
  console.log(`[WORKER] Running creator match engine for AI plan: ${aiPlanId}`);
  await runTalentShortlist(aiPlanId).catch(err => {
    console.error(`[WORKER ERROR] Creator matching failed for plan ${aiPlanId}:`, err);
    throw err;
  });

  // After shortlisting is complete, trigger the budget optimizer
  await budgetPlanQueue.add('optimize-budget', { aiPlanId });
}