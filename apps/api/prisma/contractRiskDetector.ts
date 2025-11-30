import { aiClient } from '../aiClient.js';

const riskPrompt = (clauseText: string) => `
You are a legal risk detection AI. Analyze the following contract clause for potential risks to our creator.

**Clause:**
"${clauseText}"

**Instructions:**
Identify risks like indemnity traps, perpetual rights, unusual payment schedules, or unfavorable jurisdictions.
If a risk is found, describe it and assign a severity level.

**JSON Output Schema:**
{
  "risk": {
    "description": "string",
    "severity": "'high' | 'medium' | 'low'"
  } | null
}
`;

/**
 * Analyzes a single clause for potential risks.
 */
export async function detectClauseRisk(clauseText: string) {
  const prompt = riskPrompt(clauseText);
  return aiClient.json(prompt).catch(() => ({ risk: { description: 'AI analysis failed.', severity: 'high' } }));
}