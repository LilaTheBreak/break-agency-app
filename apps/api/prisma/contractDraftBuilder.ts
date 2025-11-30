import { aiClient } from '../aiClient.js';

const draftBuilderPrompt = (context: any) => `
You are a legal tech AI. Based on the following structured deal draft, generate a full set of contract clauses in JSON format.

**Deal Draft Data:**
${JSON.stringify(context.dealDraft, null, 2)}

**Creator Persona:**
${JSON.stringify(context.persona, null, 2)}

**JSON Output Schema:**
{
  "clauses": [
    { "title": "Parties", "content": "This agreement is between [Brand Name] and [Creator Name]." },
    { "title": "Scope of Work", "content": "..." },
    { "title": "Payment Terms", "content": "..." },
    { "title": "Usage Rights", "content": "..." },
    { "title": "Exclusivity", "content": "..." },
    { "title": "Termination", "content": "..." }
  ],
  "aiRisks": ["The payment schedule is not defined. Suggest Net-30."]
}
`;

/**
 * Generates a structured contract draft from a DealDraft object.
 */
export async function buildContractDraft(context: { dealDraft: any; persona: any }) {
  try {
    const prompt = draftBuilderPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CONTRACT DRAFT BUILDER ERROR]', error);
    return { clauses: [{ title: 'Stub Clause', content: 'This is a stubbed contract.' }], aiRisks: ['AI is offline.'] };
  }
}