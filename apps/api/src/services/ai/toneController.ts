import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

export class ToneController {
  /**
   * Selects the optimal negotiation tone based on talent settings, policies, sentiment, and context.
   */
  static async determineTone({
    talent,
    talentSettings,
    agentPolicy,
    sentiment,
    negotiationSession,
    dealDraft,
  }: {
    talent: any;
    talentSettings: any;
    agentPolicy?: any;
    sentiment?: any;
    negotiationSession?: any;
    dealDraft?: any;
  }) {
    const prompt = `
You are an AI negotiation tone engine for a talent management platform.
Your job is to output the optimal negotiation tone for a reply.

Inputs:
- Talent tone: ${talentSettings?.defaultTone}
- Talent negotiation style: ${talentSettings?.negotiationStyle}
- Agent policy: ${JSON.stringify(agentPolicy || {})}
- Brand sentiment: ${JSON.stringify(sentiment || {})}
- Deal draft: ${JSON.stringify(dealDraft || {})}
- Negotiation stage: ${negotiationSession?.status || "initial"}

Return JSON ONLY with:
{
  "toneStyle": "...",
  "length": "...",
  "formality": "...",
  "aggressiveness": "...",
  "pricingStrategy": "...",
  "riskFlags": [],
  "rationale": "short reasoning"
}
`;

    const result = await aiClient.json(prompt);

    return result;
  }
}
