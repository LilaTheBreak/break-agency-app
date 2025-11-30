import { aiClient } from '../aiClient.js';

const extractorPrompt = (rawText: string) => `
You are a legal document parser. Extract the key commercial terms from the following contract text.

**Contract Text:**
---
${rawText}
---

**Instructions:**
Structure the output into a JSON object with the following keys: { deliverables, payment, usage, exclusivity, deadlines, cancellation, liability, jurisdiction }.

**JSON Output Schema:**
{
  "deliverables": "string summary",
  "payment": "string summary (e.g., '£5,000 net-30')",
  "usage": "string summary (e.g., '12 months in-perpetuity')",
  "exclusivity": "string summary",
  "deadlines": "string summary",
  "cancellation": "string summary",
  "liability": "string summary",
  "jurisdiction": "string summary"
}
`;

/**
 * Extracts structured terms from raw contract text using AI.
 */
export async function extractContractTerms(rawText: string) {
  // In a real app, the text would first be extracted from a PDF/DOCX file.
  const prompt = extractorPrompt(rawText);
  return aiClient.json(prompt).catch(() => ({ error: 'Failed to extract terms.' }));
}