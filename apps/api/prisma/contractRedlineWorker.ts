import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { extractClauses } from '../../services/contracts/clauseExtractor.js';
import { runRedlineEngine } from '../../services/ai/contracts/redlineEngine.js';
import { createNewContractVersion } from '../../services/contracts/versioning.js';

/**
 * Worker to run the AI redlining process on a contract.
 */
export default async function contractRedlineWorker(job: Job<{ contractReviewId: string }>) {
  const { contractReviewId } = job.data;
  console.log(`[WORKER] Running redline analysis for contract review: ${contractReviewId}`);

  const review = await prisma.contractReview.findUnique({ where: { id: contractReviewId } });
  if (!review || !review.rawText) throw new Error('Contract review or raw text not found.');

  // 1. Create a new version before making changes
  await createNewContractVersion(contractReviewId, { action: 'start_ai_redline' }, 'ai');

  // 2. Run the redline engine
  const { aiRisks, aiRedlines } = await runRedlineEngine(review.rawText);

  // 3. Save the results back to the main review record
  await prisma.contractReview.update({
    where: { id: contractReviewId },
    data: { aiRisks: aiRisks as any, aiRedlines: aiRedlines as any, status: 'ai_redlined' },
  });
}