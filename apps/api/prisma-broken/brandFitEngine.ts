import { aiClient } from './aiClient.js';

const fitPrompt = (context: any) => `
Analyze the fit between a creator and a brand based on their profiles. Provide a score from 0 (terrible fit) to 100 (perfect fit) and provide reasons.

Creator Profile: ${JSON.stringify(context.creatorProfile)}
Brand Profile: ${JSON.stringify(context.brandProfile)}

Respond with JSON: { "fitScore": number, "reasons": ["string"], "risks": ["string"] }
`;

/**
 * Scores the fit between a creator and a brand.
 */
export async function scoreBrandFit(context: { creatorProfile: any; brandProfile: any }) {
  try {
    const prompt = fitPrompt(context);
    return await aiClient.json(prompt) as { fitScore: number; reasons: string[]; risks: string[] };
  } catch (error) {
    console.error('[AI BRAND FIT ERROR]', error);
    return { fitScore: 65, reasons: ['General audience alignment (stub)'], risks: ['AI offline (stub)'] };
  }
}