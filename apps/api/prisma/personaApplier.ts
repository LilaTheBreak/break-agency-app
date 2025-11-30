import { aiClient } from '../aiClient.js';

const applyPersonaPrompt = (context: { textToRewrite: string; persona: any }) => `
You are an AI copywriter. Your task is to rewrite the provided text to perfectly match the creator's persona.

**Creator Persona:**
${JSON.stringify(context.persona, null, 2)}

**Original Text:**
"${context.textToRewrite}"

**Instructions:**
Rewrite the text in the creator's voice, respecting their tone, style, and rules.

**JSON Output Schema:**
{ "rewrittenText": "string" }
`;

export async function applyPersona(textToRewrite: string, persona: any) {
  const prompt = applyPersonaPrompt({ textToRewrite, persona });
  const result = await aiClient.json(prompt) as { rewrittenText: string };
  return result.rewrittenText;
}