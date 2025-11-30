import { aiClient } from '../aiClient.js';

const strategyPrompt = (context: {
  history: string;
  creatorTier: string;
  policy: any;
}) => `
You are a master negotiation strategist. Based on the negotiation history and our agent's policy, determine the best strategy for the next reply.

**Negotiation History:**
---
${context.history}
---

**Creator Tier:** ${context.creatorTier}
**Agent Policy:**
- Negotiation Style: ${context.policy.negotiationStyle}
- Required Margin: ${context.policy.requiredMarginPct}%

**Instructions:**
Decide the next move. Should we accept, make a counter-offer, ask for clarification, or hold firm?
Provide a clear justification for your decision.

**JSON Output Schema:**
{
  "decision": "'COUNTER_OFFER' | 'ACCEPT' | 'CLARIFY' | 'HOLD_FIRM'",
  "justification": "string",
  "confidence": "number (0.0-1.0)"
}
`;

/**
 * Determines the next strategic move in a negotiation.
 */
export async function generateNegotiationStrategy(context: {
  history: string;
  creatorTier: string;
  policy: any;
}) {
  try {
    const prompt = strategyPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI STRATEGIST ERROR]', error);
    return { decision: 'CLARIFY', justification: 'AI engine offline, recommend clarifying manually.', confidence: 0.1 };
  }
}