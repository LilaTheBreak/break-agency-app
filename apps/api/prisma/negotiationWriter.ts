import { aiClient } from '../aiClient.js';
import { applyPersona } from '../persona/personaApplier.js';

const writerPrompt = (context: { strategy: any; justification: string }) => `
You are an expert copywriter for a talent agent. Draft an email to execute the following negotiation strategy.

**Strategy:** ${context.strategy.decision}
**Justification:** ${context.justification}

**Instructions:**
Write a concise, professional, and friendly email body that communicates our position based on the strategy.

**JSON Output Schema:**
{ "draftBody": "string" }
`;

/**
 * Drafts a negotiation message and applies the creator's persona.
 */
export async function draftNegotiationMessage(context: { strategy: any; justification: string; persona: any }) {
  const { draftBody } = await aiClient.json(writerPrompt(context)) as { draftBody: string };

  // Apply the creator's unique voice using the Persona Engine
  const finalBody = await applyPersona(draftBody, context.persona);

  return { subject: `Re: ${context.strategy.subject}`, body: finalBody };
}