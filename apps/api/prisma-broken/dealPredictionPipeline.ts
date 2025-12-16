import prisma from '../lib/prisma.js';
import { calculateDealPrediction } from '../services/prediction/predictionEngine.js';

/**
 * Runs the full deal prediction pipeline for a given deal ID.
 * @param dealId - The ID of the DealThread to analyze.
 */
export async function runDealPrediction(dealId: string) {
  // 1. Load deal and all related data
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: {
      user: true,
      dealDraft: { include: { negotiationInsights: true } },
      brand: true,
    },
  });

  if (!deal) throw new Error('Deal not found.');

  // 2. Assemble context for the prediction engine
  const insight = deal.dealDraft?.negotiationInsights[0];
  const daysSinceLastContact = deal.lastBrandMessageAt
    ? Math.floor((new Date().getTime() - new Date(deal.lastBrandMessageAt).getTime()) / (1000 * 3600 * 24))
    : 0;

  const context = {
    isWarm: (insight?.brandContext as any)?.isWarm || false,
    initialOffer: deal.dealDraft?.offerValue,
    idealRate: (insight?.recommendedRange as any)?.ideal,
    brandIndustry: deal.brand?.name, // Simplified
    redFlags: (insight?.redFlags as any[])?.map(r => r.issue),
    daysSinceLastContact,
  };

  // 3. Call the prediction engine
  const prediction = await calculateDealPrediction(context) as any;

  // 4. Write the prediction to the database (upsert)
  const result = await prisma.dealPrediction.upsert({
    where: { dealId },
    create: {
      dealId,
      userId: deal.userId!,
      likelihood: prediction.likelihood,
      expectedBudget: prediction.expectedBudget,
      daysToClose: prediction.daysToClose,
      confidence: prediction.confidence,
      reasons: prediction.reasons,
      metadata: context,
    },
    update: {
      ...prediction,
      metadata: context,
    },
  });

  console.log(`[DEAL PREDICTION] Updated prediction for deal ${dealId}. Likelihood: ${result.likelihood}`);
  return result;
}