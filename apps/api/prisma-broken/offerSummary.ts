import { aiClient } from '../aiClient.js';

const summaryPrompt = (finalTerms: any) => `
You are a senior agent. Write a concise, human-readable summary of the following final deal terms.

**Final Terms:**
${JSON.stringify(finalTerms, null, 2)}

**Instructions:**
Summarize the deal in 2-3 sentences for a high-level overview.

**JSON Output Schema:**
{ "summary": "string" }
`;

/**
 * Generates a human-readable summary of the final deal terms.
 */
export async function generateOfferSummary(finalTerms: any) {
  try {
    const prompt = summaryPrompt(finalTerms);
    return await aiClient.json(prompt) as { summary: string };
  } catch (error) {
    console.error('[AI OFFER SUMMARY ERROR]', error);
    return { summary: 'AI summary is unavailable. Please review terms manually.' };
  }
}