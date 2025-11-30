import { aiClient } from '../aiClient.js';

const redlinePrompt = (contractText: string) => `
You are a legal AI assistant specializing in creator contracts. Analyze the following raw contract text and identify all unfavorable terms, risks, and ambiguities.

**Contract Text:**
---
${contractText}
---

**JSON Output Schema:**
{
  "aiRisks": ["The contract grants rights 'in-perpetuity', which is highly unfavorable."],
  "aiRedlines": [
    { "clause": "Section 3.1: Usage Rights", "issue": "Grants perpetual usage.", "suggestion": "Limit usage rights to 12 months on specific social media channels." }
  ]
}
`;

/**
 * Analyzes raw contract text to find risks and suggest redlines.
 */
export async function runRedlineEngine(contractText: string) {
  try {
    const prompt = redlinePrompt(contractText);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI REDLINE ENGINE ERROR]', error);
    return { aiRisks: ['AI is offline, could not analyze contract.'], aiRedlines: [] };
  }
}