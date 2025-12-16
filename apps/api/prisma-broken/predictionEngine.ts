import { aiClient } from '../ai/aiClient.js';

const predictionPrompt = (context: any) => `
You are a senior talent agent with expert predictive abilities. Analyze the following deal context and predict the likelihood of closing, the expected final budget, and the time to close.

**Deal Context:**
- Brand Relationship: ${context.isWarm ? 'Warm' : 'Cold'}
- Initial Offer: ${context.initialOffer}
- Creator's Ideal Rate: ${context.idealRate}
- Brand Industry: ${context.brandIndustry}
- Key Red Flags from Negotiation: ${context.redFlags?.join(', ') || 'None'}
- Time Since Last Contact (days): ${context.daysSinceLastContact}

**Instructions:**
Provide your predictions in a structured JSON format.
- likelihood: Probability from 0.0 to 1.0.
- expectedBudget: Your best guess at the final agreed-upon budget.
- daysToClose: Estimated number of days from now until the contract is signed.
- confidence: Your confidence in these predictions (0.0 to 1.0).
- reasons: A list of the top 3 factors influencing your prediction.

**JSON Output Schema:**
{
  "likelihood": "number",
  "expectedBudget": "number",
  "daysToClose": "number",
  "confidence": "number",
  "reasons": ["string"]
}
`;

/**
 * Calculates the probability of a deal closing, its expected value, and timeline.
 * @param dealContext - A comprehensive object containing all relevant deal data.
 */
export async function calculateDealPrediction(dealContext: any) {
  try {
    const prompt = predictionPrompt(dealContext);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI PREDICTION ENGINE ERROR]', error);
    // Return a safe, neutral stub if the AI fails
    return {
      likelihood: 0.5,
      expectedBudget: dealContext.initialOffer || 5000,
      daysToClose: 14,
      confidence: 0.3,
      reasons: ['AI engine is offline, using stubbed data.'],
    };
  }
}