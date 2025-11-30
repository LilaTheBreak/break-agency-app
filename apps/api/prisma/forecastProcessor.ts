import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateCampaignForecast } from '../../services/ai/aiCampaignForecaster.js';

/**
 * Worker to generate an AI forecast for a campaign.
 */
export default async function forecastProcessor(job: Job<{ dealDraftId: string }>) {
  const { dealDraftId } = job.data;
  console.log(`[WORKER] Generating campaign forecast for deal draft: ${dealDraftId}`);

  // 1. Build Forecast Input
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: { include: { socialAnalytics: { orderBy: { capturedAt: 'desc' }, take: 1 } } } },
  });

  if (!dealDraft || !dealDraft.user) throw new Error('Deal draft context not found.');

  const context = {
    brandName: dealDraft.brand,
    budget: dealDraft.offerValue,
    deliverables: dealDraft.deliverables,
    creatorAvgEngagement: dealDraft.user.socialAnalytics[0]?.engagementRate || 0.05,
    creatorAvgViews: dealDraft.user.socialAnalytics[0]?.impressions || 100000,
  };

  // 2. Predict Performance (Call AI)
  const forecast = await generateCampaignForecast(context) as any;

  // 3. Save Forecast
  const forecastData = {
    userId: dealDraft.userId,
    brandName: dealDraft.brand,
    predictedReach: forecast.predictedKPIs.reach,
    predictedEngagement: forecast.predictedKPIs.engagement,
    predictedViews: forecast.predictedKPIs.views,
    predictedCTR: forecast.predictedKPIs.ctr,
    predictedCPM: forecast.predictedKPIs.cpm,
    budgetMin: forecast.budgetRange.min,
    budgetMax: forecast.budgetRange.max,
    timelineMinDays: forecast.timelineRange.minDays,
    timelineMaxDays: forecast.timelineRange.maxDays,
    risks: forecast.risks,
    recommendations: forecast.recommendations,
    summary: forecast.summary,
    confidence: forecast.confidence,
  };

  await prisma.campaignForecast.upsert({
    where: { dealDraftId },
    create: { dealDraftId, ...forecastData },
    update: forecastData,
  });

  // 4. Trigger follow-up actions (e.g., Slack alert)
  if ((forecast.risks || []).length > 0) {
    console.log(`[SLACK ALERT] High risk detected in forecast for deal with ${dealDraft.brand}.`);
  }
}