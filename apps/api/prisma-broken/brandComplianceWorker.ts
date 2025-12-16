import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { getPolicyForBrand } from '../../services/brand/policyManager.js';
import { analyzeCompliance } from '../../services/brand/complianceAnalyzer.js';

/**
 * Worker to run a compliance check on a deliverable.
 */
export default async function brandComplianceWorker(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running compliance check for deliverable: ${deliverableId}`);

  const deliverable = await prisma.deliverable.findUnique({ where: { id: deliverableId }, include: { campaign: true } });
  if (!deliverable || !deliverable.campaign?.brandId) throw new Error('Deliverable or associated brand not found.');

  const policy = await getPolicyForBrand(deliverable.campaign.brandId);
  if (!policy) {
    console.warn(`No policy found for brand ${deliverable.campaign.brandId}. Skipping compliance check.`);
    return;
  }

  const check = await prisma.complianceCheck.create({ data: { deliverableId, status: 'running' } });

  const result = await analyzeCompliance({ content: deliverable.description || '', policy }) as any;

  await prisma.complianceCheck.update({
    where: { id: check.id },
    data: {
      status: result.score >= 90 ? 'passed' : 'failed',
      score: result.score,
      issues: result.issues,
      result,
    },
  });
}