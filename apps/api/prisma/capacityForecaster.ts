import { aiClient } from './aiClient.js';

const capacityPrompt = (context: any) => `
Analyze the talent's upcoming schedule (events, deadlines) to forecast their capacity for new work over the next 7 and 30 days.
Capacity is a percentage from 0 (no capacity) to 100 (fully available).

Upcoming Schedule: ${JSON.stringify(context, null, 2)}

Respond with JSON: { "next7days": number, "next30days": number }
`;

/**
 * Forecasts a talent's future work capacity.
 * @param context - Object containing future events and deliverables.
 * @returns A promise that resolves to an object with 7-day and 30-day capacity forecasts.
 */
export async function forecastCapacity(context: any) {
  try {
    const prompt = capacityPrompt(context);
    return await aiClient.json(prompt) as { next7days: number; next30days: number };
  } catch (error) {
    console.error('[AI CAPACITY FORECASTER ERROR]', error);
    return { next7days: 75, next30days: 60 }; // Fallback capacity
  }
}