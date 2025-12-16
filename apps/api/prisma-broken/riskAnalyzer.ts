import { aiClient } from '../ai/aiClient.js';

const riskPrompt = (contractText: string) => `
You are a legal risk analyst for creator contracts. Scan the following contract text for common red flags.

**Contract Text:**
---
${contractText}
---

**Instructions:**
Identify risks related to: licensing length (perpetuity), broad exclusivity, unclear payment terms, termination clauses, and ambiguous deliverable descriptions.

**JSON Output Schema:**
{ "risksJson": [{ "risk": "string", "severity": "'high' | 'medium' | 'low'", "recommendation": "string" }] }
`;

export async function analyzeContractRisks(contractText: string) {
  try {
    return await aiClient.json(riskPrompt(contractText)) as { risksJson: any[] };
  } catch (error) {
    console.error('[AI RISK ANALYZER ERROR]', error);
    return { risksJson: [{ risk: 'AI Offline', severity: 'high', recommendation: 'Manual review required.' }] };
  }
}