import { aiClient } from '../aiClient.js';

const matcherPrompt = (context: { contractTerms: any; dealTerms: any }) => `
You are a contract analysis AI. Compare the extracted contract terms against the agreed-upon deal terms and identify any mismatches.

**Agreed Deal Terms (from our system):**
${JSON.stringify(context.dealTerms, null, 2)}

**Extracted Contract Terms (from their document):**
${JSON.stringify(context.contractTerms, null, 2)}

**Instructions:**
List any discrepancies found between the two sets of terms.

**JSON Output Schema:**
{
  "mismatches": [{
    "term": "string (e.g., 'Payment')",
    "expected": "string",
    "found": "string"
  }]
}
`;

/**
 * Compares contract terms to deal terms to find mismatches.
 */
export async function matchContractToDeal(context: { contractTerms: any; dealTerms: any }) {
  const prompt = matcherPrompt(context);
  return aiClient.json(prompt).catch(() => ({ mismatches: [{ term: 'AI Offline', expected: '', found: '' }] }));
}