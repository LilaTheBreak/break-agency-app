import { PrismaClient, BrandBrief } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates analyzing a brand brief to extract key parameters.
 */
const analyseBrief = (brief: BrandBrief) => {
  return {
    primaryGoal: 'Brand Awareness',
    targetAudience: 'Gen Z, 18-24, interested in sustainable fashion',
    keyCategories: brief.categories,
  };
};

/**
 * Simulates recommending an optimal budget based on the brief's goals.
 */
const recommendBudget = (brief: BrandBrief) => {
  const estimatedMin = (brief.budgetMin || 5000) * 1.1;
  const estimatedMax = (brief.budgetMax || 10000) * 1.2;
  return {
    min: Math.round(estimatedMin / 100) * 100,
    max: Math.round(estimatedMax / 100) * 100,
    rationale: 'Budget recommendation is based on average market rates for the target categories and desired reach.',
  };
};

/**
 * Simulates predicting overall campaign performance.
 */
const predictCampaignPerformance = (budget: { min: number; max: number }) => {
  const avgBudget = (budget.min + budget.max) / 2;
  return {
    predictedReach: avgBudget * 150,
    predictedEngagement: avgBudget * 2,
    predictedViews: avgBudget * 200,
    predictedCTR: 2.5,
    risks: [
      { name: 'Market Saturation', level: 'medium', mitigation: 'Focus on highly unique creative angles to stand out.' },
      { name: 'Creator Underperformance', level: 'low', mitigation: 'Select creators with a strong track record and clear communication.' },
    ],
  };
};

/**
 * Main orchestrator function to generate a complete campaign forecast.
 * @param briefId The ID of the BrandBrief to forecast.
 * @returns The newly created CampaignForecast record.
 */
export const generateCampaignForecast = async (briefId: string) => {
  const brief = await prisma.brandBrief.findUnique({ where: { id: briefId } });
  if (!brief) throw new Error('Brand brief not found.');

  const analysis = analyseBrief(brief);
  const budget = recommendBudget(brief);
  const performance = predictCampaignPerformance(budget);

  const forecastData = {
    briefId,
    userId: brief.submittedBy, // Assuming submittedBy is the userId
    brandName: brief.brandName,
    predictedReach: performance.predictedReach,
    predictedEngagement: performance.predictedEngagement,
    predictedViews: performance.predictedViews,
    predictedCTR: performance.predictedCTR,
    budgetMin: budget.min,
    budgetMax: budget.max,
    risks: performance.risks,
    recommendations: {
      creatorMix: '1 macro-influencer for reach, 2 micro-influencers for engagement.',
      platformMix: '70% TikTok for top-of-funnel awareness, 30% Instagram for community building.',
    },
    summary: `This campaign is projected to achieve high reach within the ${analysis.targetAudience} demographic. The recommended budget is optimized for the specified goals.`,
    confidence: 0.85,
  };

  // Upsert the forecast to avoid duplicates for the same brief
  const forecast = await prisma.campaignForecast.upsert({
    where: { briefId },
    create: forecastData,
    update: { ...forecastData, version: { increment: 1 } },
  });

  return forecast;
};