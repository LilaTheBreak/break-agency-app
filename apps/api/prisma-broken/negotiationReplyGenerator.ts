import { aiClient } from '../aiClient.js';

const replyPrompt = (context: any) => `
You are an expert negotiator. Based on the provided contract redlines, write a polite but firm email to the brand to negotiate the flagged terms.

**Contract Redlines:**
${JSON.stringify(context.redlines, null, 2)}

**Creator Persona:**
${JSON.stringify(context.persona, null, 2)}

Generate a subject and body for the email.
Respond with JSON: { "subject": "string", "negotiationScript": "string" }
`;

/**
 * Generates a negotiation reply email based on contract redlines.
 */
export async function generateNegotiationReply(context: { redlines: any[]; persona: any }) {
  try {
    const prompt = replyPrompt(context);
    return await aiClient.json(prompt) as { subject: string; negotiationScript: string };
  } catch (error) {
    console.error('[AI NEGOTIATION REPLY ERROR]', error);
    return { subject: 'Re: Contract (Stub)', negotiationScript: 'This is a stubbed negotiation reply.' };
  }
}