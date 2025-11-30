import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateContractForTalent } from '../../services/contracts/contractGenerator.js';
import { saveAIContractDraft } from '../../services/contracts/contractWriter.js';
import { assetPackQueue } from '../queues/assetPackQueue.js';

/**
 * Worker to generate an AI contract draft for each talent in a budget plan.
 */
export default async function contractDraftWorker(job: Job<{ aiPlanId: string }>) {
  const { aiPlanId } = job.data;
  console.log(`[WORKER] Generating contract drafts for AI plan: ${aiPlanId}`);

  const plan = await prisma.campaignAIPlan.findUnique({ where: { id: aiPlanId }, include: { optimizedBudget: true } });
  if (!plan?.optimizedBudget) throw new Error('Optimized budget not found for this plan.');

  const breakdown = (plan.optimizedBudget.breakdown as any[]) || [];

  for (const allocation of breakdown) {
    const draft = await generateContractForTalent(plan, allocation);
    await saveAIContractDraft({
      aiPlanId,
      talentId: allocation.talentId,
      brandName: plan.brandName!,
      ...draft,
    });

    // After drafting the contract, trigger the asset pack build for this talent
    await assetPackQueue.add('build-asset-pack', { aiPlanId, talentId: allocation.talentId });
  }
}