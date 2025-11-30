import { aiClient } from './aiClient.js';

const forecastPrompt = (context: any) => `
You are a senior talent agent with expert predictive abilities. Analyze the following deal context to forecast its outcome.

**Deal Context:**
- Brand: ${context.brandName}
- Initial Offer: ${context.initialOffer || 'Not specified'}
- Deliverables: ${JSON.stringify(context.deliverables)}
- Last Brand Message Snippet: "${context.lastBrandMessageSnippet}"
- Time Since Last Brand Contact: ${context.daysSinceLastContact} days
- Brand Relationship: ${context.isWarm ? 'Warm' : 'Cold'}

**Instructions:**
Provide your predictions in a structured JSON format.
- **predictedValue**: An object with min, expected, and max values for the final deal budget.
- **likelihood**: Probability of closing the deal (0.0 to 1.0).
- **predictedTimelineDays**: Estimated days from now until the contract is signed.
- **predictedNegotiationSteps**: Estimated number of back-and-forth emails remaining.
- **recommendedAction**: The single best next action to take (e.g., "Send follow-up with new offer").
- **aiReasons**: A list of the top 3 factors influencing your prediction.

**JSON Output Schema:**
{
  "predictedValue": { "min": "number", "expected": "number", "max": "number" },
  "likelihood": "number",
  "predictedTimelineDays": "number",
  "predictedNegotiationSteps": "number",
  "recommendedAction": "string",
  "aiReasons": ["string"]
}
`;

/**
 * Generates a deal forecast using AI.
 */
export async function generateDealForecast(context: any) {
  const prompt = forecastPrompt(context);
  return aiClient.json(prompt).catch(() => ({ predictedValue: { min: 0, expected: 0, max: 0 }, likelihood: 0.5, predictedTimelineDays: 20, predictedNegotiationSteps: 3, recommendedAction: 'Manual review required', aiReasons: ['AI engine offline.'] }));
}