import { aiClient } from './aiClient.js';

const probabilityPrompt = (context: any) => `
Based on the brand fit score, brand relationship warmth, and creator capacity, predict the probability (0.0 to 1.0) of closing a deal.

Context: ${JSON.stringify(context, null, 2)}

Respond with JSON: { "closeProbability": number }
`;

/**
 * Predicts the probability of closing a deal with a brand.
 */
export async function predictCloseProbability(context: { fitScore: number; isWarm: boolean; capacity: number }) {
  try {
    const prompt = probabilityPrompt(context);
    return await aiClient.json(prompt) as { closeProbability: number };
  } catch (error) {
    console.error('[AI CLOSE PROBABILITY ERROR]', error);
    return { closeProbability: 0.4 }; // Fallback probability
  }
}