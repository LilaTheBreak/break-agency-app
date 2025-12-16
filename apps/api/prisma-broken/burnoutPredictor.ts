import { aiClient } from './aiClient.js';

const burnoutPrompt = (context: { workloadScore: number; energyScore: number; travelLoad: number }) => `
Based on the following metrics, predict the probability of talent burnout (a float from 0.0 to 1.0).
High workload and travel combined with low energy increases the risk.

Metrics: ${JSON.stringify(context, null, 2)}

Respond with JSON: { "burnoutRisk": number }
`;

/**
 * Predicts the risk of burnout for a talent.
 * @param context - An object with workload, energy, and travel scores.
 * @returns A promise that resolves to an object containing the burnout risk probability.
 */
export async function predictBurnout(context: { workloadScore: number; energyScore: number; travelLoad: number }) {
  try {
    const prompt = burnoutPrompt(context);
    return await aiClient.json(prompt) as { burnoutRisk: number };
  } catch (error) {
    console.error('[AI BURNOUT PREDICTOR ERROR]', error);
    return { burnoutRisk: 0.2 }; // Fallback risk
  }
}