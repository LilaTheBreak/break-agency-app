import { aiClient } from './aiClient.js';

/**
 * Splits raw contract text into a structured array of clauses.
 */
export function splitIntoClauses(rawText: string): string[] {
  // A more robust regex could be used here. This splits by numbered sections.
  const clauses = rawText.split(/\n\s*(?=\d+\.\s*)/).filter(c => c.trim());
  return clauses.length > 0 ? clauses : [rawText];
}

const clauseAnalysisPrompt = (clauseText: string, dealContext: any) => `
You are a legal AI assistant. Analyze the following contract clause in the context of the agreed-upon deal terms.

**Deal Context:**
- Agreed Budget: ${dealContext.budget}
- Agreed Deliverables: ${dealContext.deliverables}
- Agreed Usage: ${dealContext.usage}

**Contract Clause to Analyze:**
---
${clauseText}
---

**Instructions:**
1.  **classifyClause**: Categorize this clause (e.g., "Payment", "Usage Rights", "Termination", "Confidentiality").
2.  **analyseRisk**: Identify any potential risks or unfavorable terms for our creator.
3.  **mapContractToDeal**: Check if this clause aligns with the deal context. Note any discrepancies.

**JSON Output Schema:**
{
  "category": "string",
  "risk": { "description": "string", "severity": "'high'|'medium'|'low'" } | null,
  "alignmentIssue": { "issue": "string", "expected": "string", "found": "string" } | null
}
`;

const redlinePrompt = (clauseText: string, issue: string) => `
A contract clause has been flagged with an issue. Rewrite the clause to be more favorable to our creator.

**Original Clause:**
"${clauseText}"

**Issue to Fix:**
"${issue}"

**JSON Output Schema:**
{ "suggestedText": "string", "reasoning": "string" }
`;

/**
 * Runs a full analysis on a single contract clause.
 */
export async function analyzeClause(clauseText: string, dealContext: any) {
  try {
    const prompt = clauseAnalysisPrompt(clauseText, dealContext);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI CLAUSE ANALYSIS ERROR]', error);
    return { category: 'Unknown', risk: { description: 'AI analysis failed.', severity: 'high' }, alignmentIssue: null };
  }
}

/**
 * Generates a redline suggestion for a problematic clause.
 */
export async function generateRedline(clauseText: string, issue: string) {
  try {
    const prompt = redlinePrompt(clauseText, issue);
    return await aiClient.json(prompt) as { suggestedText: string; reasoning: string };
  } catch (error) {
    console.error('[AI REDLINE GENERATOR ERROR]', error);
    return { suggestedText: `// AI FAILED TO GENERATE REDLINE //\n${clauseText}`, reasoning: 'AI engine offline.' };
  }
}