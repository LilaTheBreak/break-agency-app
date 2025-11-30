import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateContentPerformanceForecast } from '../../services/ai/aiContentPerformanceEngine.js';

/**
 * Worker to generate an AI performance forecast for a deliverable.
 */
export default async function contentPerformanceProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Generating content performance forecast for deliverable: ${deliverableId}`);

  // 1. Load all necessary context
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      user: { include: { socialAnalytics: { orderBy: { capturedAt: 'desc' }, take: 1 } } },
      campaign: { include: { brandLinks: { include: { brand: true } } } },
    },
  });

  if (!deliverable || !deliverable.user || !deliverable.campaign) throw new Error('Deliverable context not found.');

  // 2. Build input for AI
  const context = {
    talentAnalytics: deliverable.user.socialAnalytics[0],
    deliverable: {
      type: deliverable.title, // Simplified
      platform: 'Instagram', // Simplified
      caption: deliverable.description,
    },
    brand: {
      category: deliverable.campaign.brandLinks[0]?.brand.category || 'General',
    },
  };

  // 3. Call AI Forecast Engine
  const forecast = await generateContentPerformanceForecast(context) as any;

  // 4. Save ContentPerformanceForecast
  const forecastData = {
    userId: deliverable.userId!,
    talentId: deliverable.user.talents[0].id, // Assuming one talent profile per user
    deliverableId,
    ...forecast,
  };

  await prisma.contentPerformanceForecast.upsert({
    where: { deliverableId },
    create: forecastData,
    update: forecastData,
  });

  // 5. If risks flagged, create a notification/task
  if (forecast.riskFlags && forecast.riskFlags.length > 0) {
    console.log(`[SLACK ALERT] Performance risk flagged for deliverable ${deliverableId}: ${forecast.riskFlags[0]}`);
  }
}