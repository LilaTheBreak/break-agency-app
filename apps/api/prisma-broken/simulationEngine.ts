import { aiClient } from '../../ai/aiClient.js';

const simulationPrompt = (context: { offer: number; brandProfile: any }) => `
You are a predictive modeling AI for deal negotiations.

**Our Proposed Counter-Offer:** £${context.offer}
**Brand Profile:**
- Industry: ${context.brandProfile.industry}
- Past Behavior: ${context.brandProfile.negotiationStyle}

**Instructions:**
Simulate the brand's likely reaction to our offer. Predict the probability of acceptance and their likely next move.

**JSON Output Schema:**
{
  "acceptanceLikelihood": "number (0.0-1.0)",
  "predictedBrandCounter": "number | null",
  "confidence": "number (0.0-1.0)"
}
`;

/**
 * Simulates the likelihood of an offer being accepted.
 */
export async function runOfferSimulation(context: { offer: number; brandProfile: any }) {
  const prompt = simulationPrompt(context);
  return aiClient.json(prompt).catch(() => ({ acceptanceLikelihood: 0.5, predictedBrandCounter: null, confidence: 0.2 }));
}