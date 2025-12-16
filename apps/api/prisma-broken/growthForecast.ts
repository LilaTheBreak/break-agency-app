import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Forecasts a creator's potential growth over the next 3-6 months.
 * This uses mock logic; a real implementation would use time-series forecasting models.
 * @param userId The ID of the creator to analyze.
 * @returns A growth forecast object.
 */
export const getGrowthForecast = async (userId: string) => {
  const predictions = await prisma.creatorPrediction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Mock forecast generation
  const forecast = {
    next3Months: { followers: 15000, engagement: 4.1 },
    next6Months: { followers: 25000, engagement: 3.9 },
    confidence: 0.85,
    summary: 'Based on current velocity, the creator is projected to experience significant follower growth over the next 3 months, with a slight dip in engagement rate as their audience scales.',
  };

  return forecast;
};