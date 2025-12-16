import { aiClient } from './aiClient.js';

const outreachPrompt = (context: any) => `
You are an expert outreach specialist. Write a personalized, concise, and compelling cold outreach email to a brand on behalf of a creator.

Creator: ${context.creatorName}
Brand: ${context.brandName}
Key Justification: ${context.justification}

Respond with JSON: { "subject": "string", "body": "string" }
`;

/**
 * Generates a personalized outreach email.
 */
export async function generateOutreachEmail(context: { creatorName: string; brandName: string; justification: string }) {
  try {
    const prompt = outreachPrompt(context);
    return await aiClient.json(prompt) as { subject: string; body: string };
  } catch (error) {
    console.error('[AI OUTREACH GENERATOR ERROR]', error);
    return { subject: 'Collaboration Idea (Stub)', body: 'This is a stubbed outreach email.' };
  }
}