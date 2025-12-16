import { aiClient } from './aiClient.js';

const briefPrompt = (context: any) => `
You are a creative strategist. Based on the provided creator and brand profiles, generate a creative brief for a potential collaboration.

Creator Profile: ${JSON.stringify(context.creatorProfile)}
Brand Profile: ${JSON.stringify(context.brandProfile)}

Respond with JSON: { "campaignGoals": ["string"], "targetAudience": "string", "keyMessage": "string", "dos": ["string"], "donts": ["string"] }
`;

/**
 * Generates a creative brief for a brand-creator collaboration.
 */
export async function generateBrief(context: { creatorProfile: any; brandProfile: any }) {
  try {
    const prompt = briefPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI BRIEF GENERATOR ERROR]', error);
    return {
      campaignGoals: ['Increase brand awareness (stub)'],
      targetAudience: 'Gen Z (stub)',
      keyMessage: 'This is a stubbed key message.',
    };
  }
}