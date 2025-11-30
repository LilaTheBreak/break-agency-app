import { aiClient } from '../ai/aiClient.js';

const performancePrompt = (context: any) => `
You are a social media performance analyst. Based on the creator's past analytics and the campaign brief, predict the performance for a key deliverable.

**Creator Analytics:**
${JSON.stringify(context.talentAnalytics, null, 2)}

**Campaign Brief:**
${JSON.stringify(context.campaignBrief, null, 2)}

**JSON Output Schema:**
{ "predictedReach": "number", "predictedEngagementRate": "number", "riskFlags": ["string"] }
`;

/**
 * Predicts campaign performance for a given talent and brief.
 */
export async function predictPerformance(context: { talentAnalytics: any; campaignBrief: any }) {
  try {
    const prompt = performancePrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI PERFORMANCE PREDICTOR ERROR]', error);
    return { predictedReach: 50000, predictedEngagementRate: 0.03, riskFlags: ['AI offline (stub)'] };
  }
}