import { aiClient } from '../../ai/aiClient.js';

const responsePrompt = (context: { strategy: any; simulation: any; persona: any }) => `
You are an expert negotiation copywriter. Draft an email based on the provided strategy and persona.

**Strategy:** We will counter-offer at £${context.strategy.openingMove.value}.
**Justification:** This aligns with market rates for this creator tier.
**Persona:** ${context.persona.toneKeywords}

**Instructions:**
Write a concise, professional, and friendly email body that communicates our counter-offer. Apply the creator's persona.

**JSON Output Schema:**
{ "subject": "string", "body": "string" }
`;

/**
 * Generates the final email reply based on strategy, simulation, and persona.
 */
export async function generateNegotiationReply(context: { strategy: any; simulation: any; persona: any }) {
  const prompt = responsePrompt(context);
  return aiClient.json(prompt).catch(() => ({ subject: 'Re: Your Offer', body: 'This is a stubbed AI reply.' }));
}