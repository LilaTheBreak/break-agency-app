import { aiClient } from '../../services/ai/aiClient.js';

const usageRightsPrompt = (rawText: string) => `
You are a specialist legal AI focused on media usage rights in creator contracts. Analyze the following contract text.

**Contract Text:**
---
${rawText}
---

**Instructions:**
1.  **parseUsage**: Extract the specific terms related to usage rights. Identify duration, channels (e.g., social, paid ads), territory, and any other limitations.
2.  **estimateUsageValue**: Based on the scope of the rights, provide a relative monetary value score (0-100) and a justification. A score of 100 represents full, perpetual, worldwide rights.
3.  **detectRisks**: Identify critical risks like "in perpetuity," "all media now known or hereafter devised," or overly broad channel rights.
4.  **generateUsageRedlines**: For any high-risk terms, suggest a safer, more creator-friendly alternative (e.g., change "in perpetuity" to "for 12 months on Client's owned social channels").
5.  **generateUsageNegotiationCopy**: For each redline, provide a polite email snippet to justify the change (e.g., "To keep the agreement aligned with current market standards, we'd like to propose a 12-month usage term...").
6.  **calculateExpiry**: If a duration is specified (e.g., "12 months"), calculate the expiry date from today. If perpetual, state that.

**JSON Output Schema:**
{
  "usageDetected": {
    "duration": "string",
    "channels": "string",
    "territory": "string",
    "summary": "string"
  },
  "usageValueEstimate": {
    "score": "number (0-100)",
    "justification": "string"
  },
  "usageRedlines": [
    {
      "risk": "string",
      "originalText": "string",
      "suggestedRedline": "string",
      "negotiationCopy": "string"
    }
  ],
  "usageEndDate": "ISO_8601_Date | 'Perpetual'"
}
`;

/**
 * The main orchestrator for the usage rights analysis pipeline.
 * @param rawText - The raw text content of the contract.
 */
export async function analyzeUsageRights(rawText: string) {
  if (!rawText || rawText.trim().length < 20) {
    throw new Error('Input text is too short for usage rights analysis.');
  }

  try {
    const prompt = usageRightsPrompt(rawText);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI USAGE RIGHTS ANALYZER ERROR]', error);
    throw new Error('Failed to analyze usage rights with AI.');
  }
}