import { aiClient } from '../../services/ai/aiClient.js';

const translatorPrompt = (rawText: string) => `
You are an expert legal AI assistant for a talent agency. Your task is to perform a full review of the following contract text, identify risks, and generate negotiation-ready responses.

**Contract Text:**
---
${rawText}
---

**Instructions:**
Analyze the contract and provide a comprehensive, structured JSON output.
1.  **extractClauses**: Break the contract down into its key clauses (Payment, Usage, Exclusivity, etc.).
2.  **detectMissingTerms**: Identify any standard clauses that are missing (e.g., a clear termination clause).
3.  **detectRisks**: For each clause, identify potential risks (e.g., perpetual usage, unclear payment schedule). Assign a severity (1-10).
4.  **generatePlainEnglish**: For each clause, provide a simple, one-sentence summary in plain English.
5.  **generateRedlines**: For high-risk clauses, suggest a safer, rewritten version.
6.  **generateNegotiationCopy**: For each redline, provide a polite email snippet to send to the brand explaining the requested change.

**JSON Output Schema:**
{
  "aiSummary": "A high-level, one-paragraph summary of the contract's health.",
  "aiRiskLevel": "An overall risk score from 0 (safe) to 100 (very risky).",
  "aiMissingTerms": ["string"],
  "clauses": [
    {
      "clause": "string (e.g., 'Payment Terms')",
      "text": "The original text of the clause...",
      "plainEnglish": "string",
      "risk": { "description": "string", "severity": "number (1-10)" } | null,
      "redline": { "suggestedText": "string", "reasoning": "string" } | null,
      "negotiationCopy": "string | null"
    }
  ]
}
`;

/**
 * The main orchestrator for the contract translation and review pipeline.
 * @param rawText - The raw text content of the contract.
 */
export async function translateContract(rawText: string) {
  // In a real app, text extraction from PDF/DOCX would happen before this.
  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Input text is too short for meaningful analysis.');
  }

  try {
    const prompt = translatorPrompt(rawText);
    const result = await aiClient.json(prompt);

    // Structure the output to match the Prisma model updates
    return {
      aiSummary: result.aiSummary,
      aiRiskLevel: result.aiRiskLevel,
      aiMissingTerms: result.aiMissingTerms,
      aiPlainEnglish: result.clauses.map(c => ({ clause: c.clause, summary: c.plainEnglish })),
      aiRedlineSuggestions: result.clauses.filter(c => c.redline).map(c => ({ clause: c.clause, ...c.redline })),
      aiNegotiationCopy: result.clauses.filter(c => c.negotiationCopy).map(c => ({ clause: c.clause, copy: c.negotiationCopy })),
    };
  } catch (error) {
    console.error('[AI LEGAL TRANSLATOR ERROR]', error);
    throw new Error('Failed to analyze contract with AI.');
  }
}