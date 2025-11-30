import { aiClient } from '../aiClient.js';

const extractorPrompt = (threadHistory: string) => `
You are a meticulous legal assistant. Read the following complete negotiation thread and extract the final, agreed-upon commercial terms.

**Negotiation Thread:**
---
${threadHistory}
---

**Instructions:**
Identify the final values for budget, deliverables, usage rights, exclusivity, and key dates. Ignore all earlier, superseded offers.

**JSON Output Schema:**
{
  "finalBudget": "number",
  "finalCurrency": "string",
  "finalDeliverables": [{ "type": "string", "platform": "string", "count": "number" }],
  "finalUsageRights": { "type": "string", "duration": "string" },
  "finalExclusivity": { "category": "string", "duration": "string" }
}
`;

/**
 * Extracts the final agreed-upon terms from a negotiation thread.
 */
export async function extractFinalTerms(threadHistory: string) {
  try {
    const prompt = extractorPrompt(threadHistory);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI FINAL TERMS EXTRACTOR ERROR]', error);
    return { finalBudget: 0, finalDeliverables: [], finalUsageRights: null, finalExclusivity: null };
  }
}