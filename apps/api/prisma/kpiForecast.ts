import { aiClient } from '../ai/aiClient.js';

const kpiPrompt = (context: { talentAnalytics: any; deliverableType: string }) => `
You are a social media analyst. Based on the creator's past analytics, predict the performance for a specific deliverable type.

**Creator Analytics:**
${JSON.stringify(context.talentAnalytics, null, 2)}

**Deliverable Type:** ${context.deliverableType}

**JSON Output Schema:**
{ "predictedViews": "number", "predictedEngagement": "number", "predictedCTR": "number" }
`;

/**
 * Predicts KPIs for a single deliverable by a specific talent.
 */
export async function forecastKPIs(context: { talentAnalytics: any; deliverableType: string }) {
  try {
    const prompt = kpiPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI KPI FORECAST ERROR]', error);
    return { predictedViews: 50000, predictedEngagement: 1500, predictedCTR: 0.015 };
  }
}