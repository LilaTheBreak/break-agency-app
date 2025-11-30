import { aiClient } from './aiClient.js';

const replyPrompt = (context: any) => `
You are an expert talent agent's AI assistant. Your task is to draft a reply to an incoming email from a brand.

**Latest Brand Email:**
---
${context.inboundEmail.body}
---

**Negotiation Context:**
- Current Strategy: ${context.strategy?.style || 'BALANCED'}
- Target Rate: ${context.strategy?.targetRate || 'Not set'}
- Floor Rate: ${context.strategy?.floorRate || 'Not set'}

**Talent Persona:**
- Tone: ${context.persona?.toneKeywords || 'professional, friendly'}

**Instructions:**
Based on all context, generate a reply.
- If the brand is asking a simple question, answer it.
- If the brand is pushing back on price, use the negotiation strategy to counter.
- Determine if this reply is safe to auto-send based on the agent's policy.

**JSON Output Schema:**
{ "aiSubject": "string", "aiBody": "string", "autoSend": "boolean", "confidence": "number (0.0-1.0)" }
`;

/**
 * Generates a reply to a brand email using AI.
 */
export async function generateBrandReply(context: { inboundEmail: any; strategy: any; persona: any; policy: any }) {
  try {
    const prompt = replyPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI BRAND REPLY ENGINE ERROR]', error);
    return { aiSubject: 'Re: Your Email (Stub)', aiBody: 'AI is offline. Please review this email manually.', autoSend: false, confidence: 0.2 };
  }
}