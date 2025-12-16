import { aiClient } from './aiClient.js';

const energyPrompt = (context: any) => `
Analyze the sentiment and tone of recent communications to score a talent's energy level from 0 (drained) to 100 (energetic).
Look for signs of stress, positivity, or fatigue in their messages.

Communications: ${JSON.stringify(context.recentMessages.map((m: any) => m.body))}

Respond with JSON: { "energyScore": number }
`;

/**
 * Scores a talent's energy level based on recent communications.
 * @param context - Object containing recent messages.
 * @returns A promise that resolves to an object containing the energy score.
 */
export async function scoreEnergy(context: any) {
  try {
    const prompt = energyPrompt(context);
    return await aiClient.json(prompt) as { energyScore: number };
  } catch (error) {
    console.error('[AI ENERGY SCORER ERROR]', error);
    return { energyScore: 60 }; // Fallback score
  }
}