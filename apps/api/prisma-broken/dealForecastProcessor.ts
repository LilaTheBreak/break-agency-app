import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateDealForecast } from '../../services/ai/aiForecastEngine.js';

/**
 * Worker to generate an AI forecast for a deal.
 */
export default async function dealForecastProcessor(job: Job<{ dealId?: string; draftId?: string }>) {
  const { dealId, draftId } = job.data;
  const id = dealId || draftId;
  console.log(`[WORKER] Generating deal forecast for ID: ${id}`);

  // 1. Load deal context
  const deal = await prisma.dealThread.findFirst({
    where: { OR: [{ id: dealId }, { dealDraft: { id: draftId } }] },
    include: { dealDraft: true, brand: { include: { relationships: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (!deal) throw new Error(`Deal context not found for ID ${id}`);

  // 2. Build input for AI
  const lastBrandMessage = deal.messages[0];
  const daysSinceLastContact = lastBrandMessage?.createdAt
    ? Math.floor((new Date().getTime() - new Date(lastBrandMessage.createdAt).getTime()) / (1000 * 3600 * 24))
    : 0;

  const context = {
    brandName: deal.brandName,
    initialOffer: deal.dealDraft?.offerValue,
    deliverables: deal.dealDraft?.deliverables,
    lastBrandMessageSnippet: lastBrandMessage?.body?.substring(0, 150) || 'N/A',
    daysSinceLastContact,
    isWarm: deal.brand?.relationships[0]?.warm || false,
  };

  // 3. Call AI Forecast Engine
  const forecast = await generateDealForecast(context) as any;

  // 4. Save/update DealForecast
  const forecastData = {
    userId: deal.userId!,
    brandName: deal.brandName,
    predictedValueMin: forecast.predictedValue.min,
    predictedValueExpected: forecast.predictedValue.expected,
    predictedValueMax: forecast.predictedValue.max,
    likelihood: forecast.likelihood,
    predictedTimelineDays: forecast.predictedTimelineDays,
    predictedNegotiationSteps: forecast.predictedNegotiationSteps,
    recommendedAction: { action: forecast.recommendedAction },
    aiReasons: forecast.aiReasons,
  };

  await prisma.dealForecast.upsert({
    where: dealId ? { threadId: dealId } : { draftId: draftId! },
    create: dealId ? { threadId: dealId, ...forecastData } : { draftId: draftId!, ...forecastData },
    update: forecastData,
  });

  // 5. Send Slack alert if valuable
  if (forecast.predictedValue.expected > 10000) {
    console.log(`[SLACK ALERT] High-value deal forecasted for ${deal.brandName} at £${forecast.predictedValue.expected}`);
  }
}