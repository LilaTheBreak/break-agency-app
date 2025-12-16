import prisma from '../../../lib/prisma.js';
import { checkBrand } from './brandSafetyService.js';

/**
 * The main orchestrator for a full deal review.
 * @param dealThreadId - The ID of the DealThread to analyze.
 */
export async function analyseDeal(dealThreadId: string) {
  const deal = await prisma.dealThread.findUnique({ where: { id: dealThreadId }, include: { dealDraft: true } });
  if (!deal) throw new Error('Deal thread not found.');

  // In a real pipeline, each of these would be a separate worker job.
  // For simplicity, we'll call them sequentially here.

  // 1. Brand Safety Check
  const { brandSafetyScore, brandSafetyIssues } = await checkBrand(
    deal.brandName || 'Unknown Brand',
    deal.dealDraft?.brandWebsite || 'N/A'
  ) as any;

  // 2. Contract & Negotiation Review (stubs for S63/S64 logic)
  const contractRiskScore = 85; // Mocked
  const negotiationRiskScore = 90; // Mocked

  // 3. Risk Scoring
  const overallRiskScore = (brandSafetyScore + contractRiskScore + negotiationRiskScore) / 3;

  // 4. Save the report
  const report = await prisma.aIComplianceReport.upsert({
    where: { dealThreadId },
    create: {
      dealThreadId,
      overallRiskScore,
      brandSafetyScore,
      contractRiskScore,
      negotiationRiskScore,
      brandSafetyIssues,
      summary: `Overall risk score is ${overallRiskScore.toFixed(0)}/100. Primary risks identified in brand safety.`,
    },
    update: {
      overallRiskScore,
      brandSafetyScore,
      // ... update other scores
    },
  });

  // 5. Trigger notifications for high-risk deals
  if (overallRiskScore < 60) {
    console.log(`[SLACK ALERT] High-risk deal detected for ${deal.brandName}! Score: ${overallRiskScore.toFixed(0)}`);
  }

  return report;
}