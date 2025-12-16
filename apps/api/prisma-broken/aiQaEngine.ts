import { aiClient } from '../aiClient.js';

const qaPrompt = (context: { caption: string; brief: any }) => `
You are an expert QA manager for creator campaigns. Analyze the following deliverable caption against the provided creative brief.

**Creative Brief:**
${JSON.stringify(context.brief, null, 2)}

**Deliverable Caption:**
"${context.caption}"

**Instructions:**
- Check for compliance with the brief (e.g., mentions, hashtags, tone).
- Predict performance based on caption quality (0-100).
- Flag any issues or risks (e.g., controversial language, missing requirements).

**JSON Output Schema:**
{ "qaScore": "number", "issues": ["string"], "suggestions": ["string"], "performancePrediction": "number" }
`;

/**
 * Runs an AI-powered QA check on a deliverable.
 */
export async function runAIQA(context: { caption: string; brief: any }) {
  try {
    const prompt = qaPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI QA ENGINE ERROR]', error);
    return { qaScore: 75, issues: ['AI QA is offline, manual review needed.'], suggestions: [], performancePrediction: 80 };
  }
}