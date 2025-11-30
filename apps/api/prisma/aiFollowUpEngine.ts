import { aiClient } from './aiClient.js';

const followupPrompt = (context: {
  threadStage: string;
  lastMessageSummary: string;
  followUpCount: number;
  persona: any;
}) => `
You are an expert talent agent's AI assistant. Your task is to draft a follow-up email for a negotiation that has gone silent.

**Negotiation Context:**
- Stage: ${context.threadStage}
- Summary of Last Message: "${context.lastMessageSummary}"
- This is follow-up number: ${context.followUpCount + 1}

**Talent Persona:**
- Tone: ${context.persona?.toneKeywords || 'professional, friendly'}

**Instructions:**
Generate a short, polite, and low-friction follow-up email. The goal is to re-engage the brand.
If this is the 3rd follow-up or more, adopt a slightly more firm "last chance" tone.

**JSON Output Schema:**
{ "subject": "string", "body": "string", "autoSend": "boolean", "confidence": "number (0.0-1.0)" }
`;

/**
 * Generates a follow-up email using AI.
 */
export async function generateFollowUpEmail(context: any) {
  try {
    const prompt = followupPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI FOLLOW-UP ENGINE ERROR]', error);
    return { subject: 'Following Up (Stub)', body: 'This is a stubbed follow-up email.', autoSend: false, confidence: 0.3 };
  }
}