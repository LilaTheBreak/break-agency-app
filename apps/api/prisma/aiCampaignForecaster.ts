import { aiClient } from './aiClient.js';

const forecastPrompt = (context: any) => `
You are a senior campaign strategist AI. Based on the provided deal information, creator data, and market context, generate a comprehensive campaign forecast.

**Deal Context:**
- Brand: ${context.brandName}
- Proposed Budget: ${context.budget}
- Proposed Deliverables: ${JSON.stringify(context.deliverables)}

**Creator Context:**
- Avg. Engagement Rate: ${context.creatorAvgEngagement}%
- Avg. Views per Video: ${context.creatorAvgViews}

**Instructions:**
Provide a full forecast in a structured JSON format.
- **predictedKPIs**: Object with reach, engagement, views, CTR, and CPM.
- **budgetRange**: Object with min and max recommended budget.
- **timelineRange**: Object with min and max estimated days for the campaign.
- **risks**: A list of the top 3 potential risks.
- **recommendations**: A list of 2-3 strategic recommendations.
- **summary**: A one-paragraph executive summary of the forecast.
- **confidence**: Your confidence in this forecast (0.0 to 1.0).

**JSON Output Schema:**
{
  "predictedKPIs": { "reach": "number", "engagement": "number", "views": "number", "ctr": "number", "cpm": "number" },
  "budgetRange": { "min": "number", "max": "number" },
  "timelineRange": { "minDays": "number", "maxDays": "number" },
  "risks": ["string"],
  "recommendations": ["string"],
  "summary": "string",
  "confidence": "number"
}
`;

/**
 * Generates a full campaign forecast using AI.
 */
export async function generateCampaignForecast(context: any) {
  try {
    const prompt = forecastPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CAMPAIGN FORECASTER ERROR]', error);
    return { predictedKPIs: {}, budgetRange: {}, timelineRange: {}, risks: ['AI engine offline.'], recommendations: [], summary: 'Forecast unavailable.', confidence: 0.1 };
  }
}