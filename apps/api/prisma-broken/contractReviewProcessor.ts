import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { translateContract } from '../../agent/contracts/legalTranslator.js';
import { analyzeUsageRights } from '../../agent/contracts/usageRightsAnalyzer.js';

/**
 * Worker to run the full contract review and redline pipeline.
 */
export default async function contractReviewProcessor(job: Job<{ contractReviewId: string }>) {
  const { contractReviewId } = job.data;
  console.log(`[WORKER] Running AI contract review for: ${contractReviewId}`);

  const review = await prisma.contractReview.findUnique({ where: { id: contractReviewId } });
  if (!review || !review.rawText) {
    throw new Error('Contract review or raw text not found for processing.');
  }

  // 1. Run the general translation and analysis pipeline (S81)
  const analysisResult = await translateContract(review.rawText);

  // 2. Run the specialized usage rights analysis pipeline (S82)
  const usageResult = await analyzeUsageRights(review.rawText) as any;

  // 3. Update the ContractReview record with the combined structured AI output
  await prisma.contractReview.update({
    where: { id: contractReviewId },
    data: {
      ...analysisResult,
      aiUsageDetected: usageResult.usageDetected,
      aiUsageValueEstimate: usageResult.usageValueEstimate,
      aiUsageRedlines: usageResult.usageRedlines,
      aiUsageNegotiationCopy: usageResult.usageRedlines.map(r => r.negotiationCopy),
      usageEndDate: usageResult.usageEndDate === 'Perpetual' ? null : new Date(usageResult.usageEndDate),
      status: 'ai_reviewed',
    },
  });

  // 4. (Optional) Log high-risk usage terms to history
  usageResult.usageRedlines?.forEach(async (redline) => {
    if (redline.risk.toLowerCase().includes('perpetuity')) {
      await prisma.contractRiskHistory.create({ data: { contractId: contractReviewId, userId: review.userId, riskType: 'usage_perpetuity', severity: 9 } });
    }
  });
}