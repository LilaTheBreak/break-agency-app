import type { Job } from 'bullmq';
import { runBudgetOptimizer } from '../../services/budget/budgetOptimizer.js';
import { contractDraftQueue } from '../queues/contractDraftQueue.js';

/**
 * Worker to run the AI budget optimization process for a campaign plan.
 */
export default async function budgetPlanWorker(job: Job<{ aiPlanId:string }>) {
  const { aiPlanId } = job.data;
  console.log(`[WORKER] Running budget optimizer for AI plan: ${aiPlanId}`);
  await runBudgetOptimizer(aiPlanId).catch(err => {
    console.error(`[WORKER ERROR] Budget optimization failed for plan ${aiPlanId}:`, err);
    throw err;
  });

  // After budget is optimized, trigger contract generation
  await contractDraftQueue.add('generate-contracts', { aiPlanId });
}