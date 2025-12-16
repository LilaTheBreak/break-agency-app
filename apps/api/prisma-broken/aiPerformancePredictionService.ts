import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const predictionPrompt = (context: {
  platform: string;
  caption: string;
  creatorHistory: any;
  topic: string;
}) => `
You are a specialist AI in social media performance forecasting. Your task is to predict the performance of a given deliverable.

**Context:**
- **Platform:** ${context.platform}
- **Topic:** ${context.topic}
- **Creator's Average Performance:** ${JSON.stringify(context.creatorHistory, null, 2)}

**Content to Analyze:**
- **Caption:** "${context.caption}"

**Instructions:**
Generate a detailed performance prediction in a structured JSON format.
1.  **predictMetrics**: Forecast key metrics like views, likes, comments, and shares. Base this on the creator's historical average and the specific content.
2.  **performanceScore**: Provide an overall performance score (0-100) representing its potential compared to the creator's average content.
3.  **riskReasons**: List 1-2 potential risks that could hinder performance (e.g., "Caption is too long," "Topic is niche").
4.  **improvementTips**: Suggest 1-2 actionable tips to improve the predicted performance.

**JSON Output Schema:**
{
  "predictedViews": "number",
  "predictedLikes": "number",
  "predictedComments": "number",
  "predictedShares": "number",
  "performanceScore": "number (0-100)",
  "riskReasons": ["string"],
  "improvementTips": ["string"]
}
`;

/**
 * The main orchestrator for the AI performance prediction pipeline.
 * @param deliverableId - The ID of the DeliverableItem to predict performance for.
 */
export async function predictDeliverablePerformance(deliverableId: string) {
  // 1. Load Context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: { deal: { include: { user: { include: { talents: true } } } } },
  });

  if (!deliverable || !deliverable.deal.user || !deliverable.deal.user.talents[0]) {
    throw new Error('Deliverable context is incomplete for performance prediction.');
  }

  const talent = deliverable.deal.user.talents[0];

  // 2. Run AI Prediction
  const result = await aiClient.json(predictionPrompt({
    platform: 'TikTok', // This would be dynamic
    caption: deliverable.caption || '',
    topic: deliverable.type,
    creatorHistory: { avgViews: 500000, avgLikes: 25000 }, // Mocked from SocialAnalytics
  })) as any;

  // 3. Save the structured prediction to the database
  const prediction = await prisma.performancePrediction.upsert({
    where: { deliverableId },
    create: {
      deliverableId,
      talentId: talent.id,
      platform: 'TikTok',
      ...result,
      modelVersion: 'v1.0',
    },
    update: {
      ...result,
      modelVersion: 'v1.0',
    },
  });

  // Also update the summary on the deliverable itself
  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { aiQaPerformance: { score: result.performanceScore, tier: 'N/A' } },
  });

  console.log(`[AI PREDICTOR] Successfully generated performance prediction for deliverable ${deliverableId}.`);
  return prediction;
}