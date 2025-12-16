import { aiClient } from './aiClient.js';

const emailPrompt = (context: { type: string; data: any; persona?: any }) => `
You are an expert communications assistant for a talent agency. Write a professional email based on the following context.

**Email Type:** ${context.type}
**Recipient Data:** ${JSON.stringify(context.data, null, 2)}
**Sender Persona/Tone:** ${context.persona?.tone || 'professional and friendly'}

**Instructions:**
Generate a concise and clear subject line and email body.

**JSON Output Schema:**
{ "subject": "string", "body": "string" }
`;

/**
 * Generates a subject and body for an email using AI.
 */
export async function writeAIEmail(context: { type: string; data: any; persona?: any }) {
  try {
    const prompt = emailPrompt(context);
    return await aiClient.json(prompt) as { subject: string; body: string };
  } catch (error) {
    console.error('[AI EMAIL WRITER ERROR]', error);
    return { subject: `Update on Your Campaign (Stub)`, body: 'This is a stubbed email body. Please see attached.' };
  }
}