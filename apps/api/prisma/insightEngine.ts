import { aiClient } from '../ai/aiClient.js';

const insightPrompt = (context: { performanceData: any[] }) => `
You are a social media performance analyst. Based on the following time-series performance data for a piece of content, generate insights.

**Performance Data:**
${JSON.stringify(context.performanceData, null, 2)}

**Instructions:**
1.  **summary**: Write a one-sentence summary of the content's performance.
2.  **recommendations**: Provide 1-2 actionable recommendations for future content based on these results.
3.  **highlights**: Identify the single most positive metric (e.g., "High share count indicates strong resonance").

**JSON Output Schema:**
{
  "summary": "string",
  "recommendations": ["string"],
  "highlights": ["string"]
}
`;

/**
 * Generates AI-powered insights from performance data.
 */
export async function generatePerformanceInsights(performanceData: any[]) {
  const prompt = insightPrompt({ performanceData });
  return aiClient.json(prompt).catch(() => ({ summary: 'AI insights are currently unavailable.', recommendations: [], highlights: [] }));
}