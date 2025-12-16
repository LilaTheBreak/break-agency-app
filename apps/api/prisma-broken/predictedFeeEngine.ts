import { aiClient } from './aiClient.js';

const feePrompt = (context: any) => `
Based on the creator's pricing model, the brand's industry, and the fit score, predict a realistic fee for a standard sponsorship package (e.g., 1 video, 2 stories).

Context: ${JSON.stringify(context, null, 2)}

Respond with JSON: { "predictedFee": number, "currency": "string" }
`;

/**
 * Predicts a suitable fee for a potential deal.
 */
export async function predictFee(context: { creatorPricing: any; brandIndustry: string; fitScore: number }) {
  try {
    const prompt = feePrompt(context);
    return await aiClient.json(prompt) as { predictedFee: number; currency: string };
  } catch (error) {
    console.error('[AI FEE PREDICTION ERROR]', error);
    return { predictedFee: 5000, currency: 'GBP' }; // Fallback fee
  }
}