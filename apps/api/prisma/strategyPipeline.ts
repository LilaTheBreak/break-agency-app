import prisma from '../lib/prisma.js';
import { buildNegotiationStrategy } from '../services/negotiation/strategyEngine.js';

/**
 * Recalculates and saves the negotiation strategy for a given deal.
 * @param dealId - The ID of the DealThread.
 */
export async function recalcNegotiationStrategy(dealId: string) {
  // 1. Load all relevant data for the deal
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: {
      dealDraft: true,
      prediction: true,
      user: { include: { talents: { include: { aiSettings: true } } } },
      brand: { include: { relationships: { where: { userId: 'clxrz45gn000008l4hy285p0g' } } } }, // Mock user ID
    },
  });

  if (!deal || !deal.user) throw new Error('Deal or associated user not found.');

  // 2. Assemble the input for the strategy engine
  const input = {
    prediction: deal.prediction,
    dealDraft: deal.dealDraft,
    talentSettings: deal.user.talents[0]?.aiSettings,
    isWarm: deal.brand?.relationships[0]?.warm || false,
  };

  // 3. Compute the new strategy
  const strategy = await buildNegotiationStrategy(input as any);

  // 4. Upsert the strategy into the database
  const result = await prisma.negotiationStrategy.upsert({
    where: { dealId },
    create: {
      dealId,
      userId: deal.userId,
      ...strategy,
    },
    update: {
      ...strategy,
    },
  });

  console.log(`[STRATEGY PIPELINE] Updated strategy for deal ${dealId}. Style: ${result.style}`);
  return result;
}