import { aiClient } from '../ai/aiClient.js';

const counterDraftPrompt = (context: { redlines: any[]; originalClauses: any[] }) => `
You are a legal AI specializing in contract negotiation. Based on the requested redlines, rewrite the original contract clauses to be more favorable to our creator.

**Requested Redlines:**
${JSON.stringify(context.redlines, null, 2)}

**Original Clauses:**
${JSON.stringify(context.originalClauses, null, 2)}

Respond with JSON containing the rewritten clauses: { "counterDraftClauses": [{ "title": "string", "content": "string" }] }
`;

/**
 * Generates a full counter-draft based on AI-suggested redlines.
 */
export async function generateCounterDraft(context: { redlines: any[]; originalClauses: any[] }) {
  try {
    const prompt = counterDraftPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI COUNTER-DRAFT ERROR]', error);
    return { counterDraftClauses: [{ title: 'Counter-Proposal (Stub)', content: 'This is a stubbed counter-draft.' }] };
  }
}