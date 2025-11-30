import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { buildContentInput, predictContentQuality, compileQualityScore } from '../../services/ai/aiContentQuality.js';

/**
 * Worker to generate an AI content quality analysis for a deliverable.
 */
export default async function contentQualityProcessor(job: Job<{ deliverableId: string }>) {
  const { deliverableId } = job.data;
  console.log(`[WORKER] Running content quality analysis for deliverable: ${deliverableId}`);

  // 1. Build Input
  const input = await buildContentInput(deliverableId);

  // 2. Predict Quality
  const result = await predictContentQuality(input);
  const overallScore = compileQualityScore(result.scores);

  // 3. Save Result
  const qualityRecord = await prisma.contentQuality.upsert({
    where: { deliverableId },
    create: {
      deliverableId,
      overallScore,
      ...result.scores,
      suggestions: result.suggestions,
      aiSummary: `Overall score of ${overallScore.toFixed(0)}/100, with strong brand fit but room for optimisation.`,
    },
    update: {
      overallScore,
      ...result.scores,
      suggestions: result.suggestions,
    },
  });

  // Save hook suggestions
  for (const hook of result.hooks) {
    await prisma.contentHookSuggestion.create({ data: { qualityCheckId: qualityRecord.id, hookText: hook } });
  }
}