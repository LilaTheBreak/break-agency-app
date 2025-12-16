import { aiClient } from '../../ai/aiClient.js';

const strategyPrompt = (context: { history: string; policy: any }) => `
You are a master negotiation strategist. Based on the negotiation history and our agent's policy, generate a high-level strategy.

**Negotiation History:**
---
${context.history}
---

**Agent Policy:**
- Negotiation Style: ${context.policy.negotiationStyle}

**Instructions:**
Define a strategy with an opening move, a primary concession, and a walk-away point.

**JSON Output Schema:**
{
  "strategyName": "'Anchor High' | 'Meet in the Middle' | 'Value-Add'",
  "openingMove": { "type": "'COUNTER_OFFER' | 'CLARIFY'", "value": "number | null", "notes": "string" },
  "concession": { "type": "'DISCOUNT' | 'EXTRA_DELIVERABLE'", "details": "string" },
  "walkAwayPoint": { "value": "number", "reason": "string" }
}
`;

/**
 * Generates a high-level negotiation strategy.
 */
export async function generateNegotiationStrategy(context: { history: string; policy: any }) {
  const prompt = strategyPrompt(context);
  return aiClient.json(prompt).catch(() => ({ error: 'Failed to generate strategy.' }));
}