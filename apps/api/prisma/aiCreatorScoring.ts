import { aiClient } from './aiClient.js';

const scoringPrompt = (context: {
  creatorPersona: any;
  pastDeals: any[];
  growthMetrics: any;
}) => `
You are an AI analyst for a top-tier talent agency. Your task is to score a creator based on a holistic view of their career.

**Creator Persona & Niche:**
${JSON.stringify(context.creatorPersona, null, 2)}

**Past Campaign Highlights:**
${context.pastDeals.map(d => `- ${d.brandName}: £${d.value}`).join('\n')}

**Growth Metrics (Last 90 Days):**
- Follower Growth: ${context.growthMetrics.followerChange}%
- Engagement Velocity: ${context.growthMetrics.engagementChange}%

**Instructions:**
Provide a score (0-100) for each of the following vectors:
- **marketFitScore**: How relevant and in-demand is the creator's niche right now?
- **predictedEarningsScore**: Based on past deals, what is their future earning potential?
- **alignmentScore**: How well do they align with our agency's target brand categories (e.g., tech, beauty, lifestyle)?
- **velocityScore**: How strong is their recent growth trajectory?
- **portfolioScore**: How impressive is their portfolio of past brand partnerships?

Also provide a one-sentence summary and two actionable recommendations.

**JSON Output Schema:**
{
  "scores": { "marketFitScore": "number", "predictedEarningsScore": "number", "alignmentScore": "number", "velocityScore": "number", "portfolioScore": "number" },
  "summary": "string",
  "recommendations": ["string"]
}
`;

/**
 * Runs the full AI scoring suite for a creator.
 */
export async function evaluateCreator(context: any) {
  try {
    const prompt = scoringPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CREATOR SCORING ERROR]', error);
    return {
      scores: { marketFitScore: 50, predictedEarningsScore: 50, alignmentScore: 50, velocityScore: 50, portfolioScore: 50 },
      summary: 'AI scoring is currently unavailable.',
      recommendations: ['Manual review recommended.'],
    };
  }
}

/**
 * Compiles the final overall score from weighted sub-scores.
 */
export function combineScoreComponents(scores: { [key: string]: number }): number {
  const weights = {
    marketFitScore: 0.25,
    predictedEarningsScore: 0.25,
    alignmentScore: 0.2,
    velocityScore: 0.15,
    portfolioScore: 0.15,
  };
  let totalScore = 0;
  for (const key in scores) {
    totalScore += (scores[key] || 0) * (weights[key] || 0);
  }
  return totalScore;
}