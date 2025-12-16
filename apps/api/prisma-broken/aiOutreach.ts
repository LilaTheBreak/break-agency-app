import { aiClient } from './aiClient.js';

const outreachPrompt = (context: {
  creatorPersona: any;
  brandInfo: any;
  type: 'initial' | 'follow_up';
}) => `
You are an expert talent agent writing a cold outreach email. Your goal is to be concise, personalized, and compelling.

**Our Creator's Persona:**
${JSON.stringify(context.creatorPersona, null, 2)}

**Target Brand Info:**
- Name: ${context.brandInfo.name}
- Industry: ${context.brandInfo.industry}
- Recent News/Signals: ${context.brandInfo.signals?.join(', ') || 'None'}

**Email Type:** ${context.type}

**Instructions:**
Generate a subject and body for the email. Personalize the opening by referencing something specific about the brand.

**JSON Output Schema:**
{ "subject": "string", "body": "string", "confidence": "number (0.0-1.0)" }
`;

/**
 * Generates a personalized outreach email using AI.
 */
export async function generateInitialOutreach(context: any) {
  try {
    const prompt = outreachPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI OUTREACH ENGINE ERROR]', error);
    return { subject: 'Collaboration Idea (Stub)', body: 'This is a stubbed outreach email.', confidence: 0.2 };
  }
}