import prisma from '../../lib/prisma.js';
import { getMarketBenchmark } from './marketDataService.js';
import { calculateUsageMultiplier, calculateExclusivityMultiplier, getSeasonalMultiplier } from './usageFeeService.js';

/**
 * Calculates the final recommended price for a deal draft.
 * @param userId - The ID of the creator.
 * @param dealDraftId - The ID of the deal draft to price.
 */
export async function calculateDealPricing(userId: string, dealDraftId: string) {
  // 1. Load all necessary context
  const dealDraft = await prisma.dealDraft.findUnique({ where: { id: dealDraftId } });
  const pricingModel = await prisma.talentPricingModel.findMany({ where: { talent: { userId } } });

  if (!dealDraft) throw new Error('Deal draft not found.');

  // 2. Calculate base rate from deliverables
  let baseRate = 0;
  const deliverables = (dealDraft.deliverables as any[]) || [];
  for (const deliverable of deliverables) {
    const modelRate = pricingModel.find(p => p.deliverable === deliverable.type)?.baseRate || 500; // Default rate
    baseRate += modelRate * (deliverable.count || 1);
  }

  // 3. Apply multipliers
  const usageMultiplier = calculateUsageMultiplier(dealDraft.usageRights);
  const exclusivityMultiplier = calculateExclusivityMultiplier(dealDraft.exclusivityTerms as any[]);
  const seasonalMultiplier = getSeasonalMultiplier();

  const recommendedPrice = Math.floor(baseRate * usageMultiplier * exclusivityMultiplier * seasonalMultiplier);

  // 4. Get market benchmarks
  const { marketLow, marketAvg, marketHigh } = await getMarketBenchmark(deliverables[0]?.type || 'default');

  // 5. Generate upsells
  const upsells = generateUpsells(dealDraft);

  // 6. Log the snapshot
  const snapshot = await prisma.pricingSnapshot.create({
    data: {
      userId,
      dealId: dealDraftId,
      brandName: dealDraft.brand,
      baseRate,
      recommended: recommendedPrice,
      marketLow,
      marketAvg,
      marketHigh,
      upsells,
      metadata: {
        usageMultiplier,
        exclusivityMultiplier,
        seasonalMultiplier,
      },
    },
  });

  console.log(`[PRICING ENGINE] Generated snapshot ${snapshot.id} for deal ${dealDraftId}. Recommended: ${recommendedPrice}`);

  return snapshot;
}

/**
 * Generates potential upsell opportunities for a deal.
 * @param dealDraft - The deal draft object.
 */
export function generateUpsells(dealDraft: any) {
  const upsells = [];

  // Suggest adding stories if not present
  const hasStories = (dealDraft.deliverables as any[])?.some(d => d.type.toLowerCase().includes('story'));
  if (!hasStories) {
    upsells.push({
      type: 'ADD_STORIES',
      description: 'Add a set of 3 Instagram Stories to boost reach.',
      estimatedValue: 500,
    });
  }

  // Suggest whitelisting if not present
  const hasWhitelisting = (dealDraft.usageRights as any)?.type.toLowerCase().includes('paid');
  if (!hasWhitelisting) {
    upsells.push({
      type: 'WHITELISTING',
      description: 'Add 30-day paid media rights (whitelisting) for £1500.',
      estimatedValue: 1500,
    });
  }

  return upsells;
}