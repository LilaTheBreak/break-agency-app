import { aiClient } from './aiClient.js';

const feedPrompt = (context: any) => `
You are an AI talent agent. Based on the creator's profile and recent performance, identify 5 new, untapped brand categories or specific brands that would be a great fit for them.

Creator Profile: ${JSON.stringify(context.creatorProfile)}

Respond with JSON: { "recommendations": [{ "brandName": "string", "justification": "string", "opportunityType": "sponsorship" | "affiliate" }] }
`;

/**
 * Generates a list of new, smart-matched brand opportunities for a creator.
 */
export async function generateSmartDeals(context: { creatorProfile: any }) {
  try {
    const prompt = feedPrompt(context);
    return await aiClient.json(prompt) as { recommendations: any[] };
  } catch (error) {
    console.error('[AI SMART DEALS ERROR]', error);
    return { recommendations: [{ brandName: 'Gymshark (Stub)', justification: 'Fitness audience alignment.' }] };
  }
}