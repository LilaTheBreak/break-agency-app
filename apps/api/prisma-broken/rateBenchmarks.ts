import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Benchmarks a creator's rates against the market.
 * This mock function simulates fetching market data and comparing it.
 * @param userId The ID of the creator to analyze.
 * @returns An object containing the creator's rates and market comparisons.
 */
export const getRateBenchmarks = async (userId: string) => {
  const pricingModels = await prisma.talentPricingModel.findMany({
    where: { talent: { userId } },
  });

  if (pricingModels.length === 0) {
    return { benchmarks: [], summary: 'No pricing models found for this creator.' };
  }

  // Mock market data generation
  const benchmarks = pricingModels.map(model => {
    const marketAvg = model.baseRate * 1.1; // Market is 10% higher on average
    return {
      deliverable: model.deliverable,
      creatorRate: model.baseRate,
      marketAverage: marketAvg,
      percentile: model.baseRate > marketAvg ? 65 : 45, // Mock percentile
    };
  });

  const summary = `The creator's rates are generally competitive, slightly below the market average for most deliverables. There is potential to increase rates for TikTok content.`;

  return { benchmarks, summary };
};