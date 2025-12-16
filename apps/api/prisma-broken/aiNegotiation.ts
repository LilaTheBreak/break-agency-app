import { aiClient } from './aiClient.js';

const analysisPrompt = (context: { emailBody: string; creatorTier: string }) => `
You are a negotiation analysis AI for a talent agency. Your task is to analyze an inbound email, extract the offer, benchmark it, and identify risks.

**Inbound Email Body:**
---
${context.emailBody}
---

**Creator Tier:** ${context.creatorTier}

**Instructions:**
1.  **extractOffer**: Identify the monetary offer and key deliverables.
2.  **benchmarkRate**: Based on the creator tier and deliverables, provide a market rate benchmark (low, avg, high).
3.  **detectRedFlags**: Identify any unfavorable terms, risks, or red flags in the email.

**JSON Output Schema:**
{
  "offer": { "value": "number", "currency": "string", "deliverables": ["string"] },
  "benchmark": { "low": "number", "avg": "number", "high": "number", "rationale": "string" },
  "redFlags": [{ "flag": "string", "severity": "'high' | 'medium' | 'low'", "suggestion": "string" }]
}
`;

const counterPrompt = (context: { offer: any; benchmark: any; redFlags: any[] }) => `
You are an expert negotiator. Based on the provided analysis, generate two distinct counter-offer strategies.

**Initial Offer:** ${context.offer.value}
**Market Average:** ${context.benchmark.avg}
**Key Red Flags:** ${context.redFlags.map(r => r.flag).join(', ')}

**Instructions:**
Generate a 'Balanced' and an 'Aggressive' counter-offer. For each, provide a new value, a justification, and a script for the agent to use.

**JSON Output Schema:**
{
  "counterOffers": [
    { "variant": "balanced", "suggestedValue": "number", "justification": "string", "script": "string" },
    { "variant": "aggressive", "suggestedValue": "number", "justification": "string", "script": "string" }
  ]
}
`;

/**
 * Runs the initial analysis of a negotiation email.
 */
export async function analyzeNegotiationEmail(context: { emailBody: string; creatorTier: string }) {
  try {
    const prompt = analysisPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI NEGOTIATION ANALYSIS ERROR]', error);
    return { offer: null, benchmark: null, redFlags: [{ flag: 'AI Offline', severity: 'high', suggestion: 'Manual review required.' }] };
  }
}

/**
 * Generates counter-offer strategies based on an initial analysis.
 */
export async function generateCounterOffers(context: { offer: any; benchmark: any; redFlags: any[] }) {
  try {
    const prompt = counterPrompt(context);
    return await aiClient.json(prompt) as { counterOffers: any[] };
  } catch (error) {
    console.error('[AI COUNTER-OFFER ERROR]', error);
    return { counterOffers: [] };
  }
}