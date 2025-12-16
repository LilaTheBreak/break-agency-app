import { aiClient } from './aiClient.js';

const forecastPrompt = (context: any) => `
You are a viral content analyst. Based on the creator's historical data and the details of the upcoming deliverable, forecast its performance.

**Creator's Past Performance (Avg):**
- Engagement Rate: ${context.talentAnalytics?.engagementRate || 'N/A'}
- Average Views: ${context.talentAnalytics?.views || 'N/A'}

**Deliverable Details:**
- Type: ${context.deliverable.type}
- Platform: ${context.deliverable.platform}
- Caption/Topic: "${context.deliverable.caption}"
- Brand Category: ${context.brand.category}

**Instructions:**
Provide your predictions in a structured JSON format.
- **predictedViews**: Estimated total views.
- **predictedEngagement**: Estimated total likes, comments, shares.
- **performanceTier**: A grade from "A" (viral potential) to "F" (poor performance).
- **viralityScore**: A score from 0.0 to 1.0 indicating viral potential.
- **riskFlags**: A list of potential risks (e.g., "Topic is niche," "Caption lacks a clear call-to-action").
- **suggestions**: A list of actionable suggestions to improve performance.
- **reasons**: A list of the top factors influencing your forecast.

**JSON Output Schema:**
{
  "predictedViews": "number",
  "predictedEngagement": "number",
  "performanceTier": "string",
  "viralityScore": "number",
  "riskFlags": ["string"],
  "suggestions": ["string"],
  "reasons": ["string"]
}
`;

export async function generateContentPerformanceForecast(context: any) {
  const prompt = forecastPrompt(context);
  return aiClient.json(prompt).catch(() => ({ predictedViews: 0, predictedEngagement: 0, performanceTier: 'N/A', viralityScore: 0, riskFlags: ['AI engine offline.'], suggestions: [], reasons: [] }));
}