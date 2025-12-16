import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { evaluateCreator, combineScoreComponents } from '../../services/ai/aiCreatorScoring.js';

/**
 * Worker to generate an AI score for a creator.
 */
export default async function creatorScoreProcessor(job: Job<{ talentId: string }>) {
  const { talentId } = job.data;
  console.log(`[WORKER] Generating creator score for talent: ${talentId}`);

  // 1. Build Input
  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    include: {
      user: { include: { personaProfile: true, socialAnalytics: { take: 2, orderBy: { capturedAt: 'desc' } } } },
      // In a real app, you'd fetch DealThreads here
    },
  });
  if (!talent || !talent.user) throw new Error('Talent not found.');

  const context = {
    creatorPersona: talent.user.personaProfile,
    pastDeals: [{ brandName: 'Example Brand', value: 15000 }], // Mocked
    growthMetrics: { // Mocked
      followerChange: 5.2,
      engagementChange: 1.1,
    },
  };

  // 2. Evaluate with AI
  const result = await evaluateCreator(context) as any;
  const overallScore = combineScoreComponents(result.scores);

  // 3. Save Score
  const scoreData = {
    talentId,
    userId: talent.userId,
    overallScore,
    ...result.scores,
    rawScores: result.scores,
    summary: result.summary,
    recommendations: result.recommendations,
  };

  await prisma.creatorScore.upsert({
    where: { talentId },
    create: scoreData,
    update: scoreData,
  });

  console.log(`[WORKER] Score for talent ${talentId} complete. Overall: ${overallScore.toFixed(0)}`);
}