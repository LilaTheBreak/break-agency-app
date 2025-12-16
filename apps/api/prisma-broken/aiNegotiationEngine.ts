import { aiClient } from './aiClient.js';

const analysisPrompt = (context: { emailBody: string; policy: any }) => `
You are a negotiation analysis AI. Your task is to analyze an inbound email against our agent's policy.

**Inbound Email Body:**
---
${context.emailBody}
---

**Agent Policy:**
- Sandbox Mode: ${context.policy.sandboxMode}
- Required Margin: ${context.policy.requiredMarginPct}%

**Instructions:**
1.  **extractOffer**: Identify the monetary offer.
2.  **analysePolicyCompliance**: Check if the offer meets the required margin.
3.  **detectRedFlags**: Identify any unfavorable terms or risks.

**JSON Output Schema:**
{
  "offer": { "value": "number" },
  "compliance": { "isCompliant": "boolean", "reason": "string" },
  "redFlags": ["string"]
}
`;

const counterOfferPrompt = (context: { offerValue: number; creatorTier: string }) => `
You are an expert negotiator. An initial offer of £${context.offerValue} has been made for a Tier ${context.creatorTier} creator.

**Instructions:**
Generate a compelling counter-offer. Provide a new value, a strong justification, and a script for the agent.

**JSON Output Schema:**
{ "counterOffer": { "suggestedValue": "number", "justification": "string", "script": "string" } }
`;

/**
 * Runs the initial analysis of a negotiation email.
 */
export async function extractOfferFromEmail(context: { emailBody: string; policy: any }) {
  try {
    const prompt = analysisPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI NEGOTIATION EXTRACTOR ERROR]', error);
    return { offer: null, compliance: { isCompliant: false, reason: 'AI Offline' }, redFlags: ['AI Offline'] };
  }
}

/**
 * Generates a counter-offer.
 */
export async function generateCounterOffer(context: { offerValue: number; creatorTier: string }) {
  try {
    const prompt = counterOfferPrompt(context);
    return await aiClient.json(prompt) as { counterOffer: any };
  } catch (error) {
    console.error('[AI COUNTER-OFFER ERROR]', error);
    return { counterOffer: { suggestedValue: context.offerValue * 1.2, justification: 'Stub justification.', script: 'Stub script.' } };
  }
}

/**
 * Logs the final decision of the negotiation pipeline.
 */
export async function logNegotiationDecision(sessionId: string, decision: any) {
  // In a real app, this would write to the NegotiationDecision table.
  console.log(`[NEGOTIATION DECISION] Logging decision for session ${sessionId}:`, decision);
}