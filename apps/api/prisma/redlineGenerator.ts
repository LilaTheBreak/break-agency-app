import { aiClient } from './aiClient.js';

const redlinePrompt = (contractJson: any) => `
You are a legal AI assistant specializing in creator contracts. Analyze the following contract terms (in JSON format) and provide redlines.

**Contract Terms:**
${JSON.stringify(contractJson, null, 2)}

**Instructions:**
- Flag any terms that are unfavorable to the creator (e.g., perpetual usage, broad exclusivity, unclear payment terms).
- Suggest more favorable wording for each flagged term.
- Ensure the terms align with standard industry practice for creator deals.

**JSON Output Schema:**
{
  "redlines": [{ "term": "e.g., usageRights", "issue": "The rights are in-perpetuity.", "suggestion": "Suggest changing to a 12-month license for specific channels." }],
  "warnings": ["The payment schedule is net-60, which is long. Aim for net-30."],
  "safeRevisionText": "A fully revised, safe version of the problematic clauses."
}
`;

/**
 * Generates AI-powered redlines and suggestions for a contract draft.
 * @param contractJson The contract terms in a structured JSON format.
 * @returns An object containing redlines, warnings, and suggested revisions.
 */
export async function generateAIRedlines(contractJson: any) {
  const prompt = redlinePrompt(contractJson);
  const result = await aiClient.json(prompt);
  return result;
}