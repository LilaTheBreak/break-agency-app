import { aiClient } from './aiClient.js';

const guardPrompt = (context: {
  entityType: string;
  timeToDeadlineHours: number;
  riskHeuristics: string[];
}) => `
You are an AI project manager. Analyze the following deadline context and provide a concise summary and risk assessment.

**Deadline Context:**
- Item Type: ${context.entityType}
- Hours Until Due: ${context.timeToDeadlineHours.toFixed(1)}
- Initial Risk Flags: ${context.riskHeuristics.join(', ')}

**Instructions:**
Provide a one-sentence summary of the situation and a risk score from 0.0 (no risk) to 1.0 (critical risk).

**JSON Output Schema:**
{ "aiSummary": "string", "riskScore": "number" }
`;

/**
 * Uses AI to analyze a deadline's context and assess its risk.
 */
export async function analyzeDeadlineRisk(context: any) {
  const prompt = guardPrompt(context);
  return aiClient.json(prompt).catch(() => ({ aiSummary: 'AI analysis failed.', riskScore: 0.5 }));
}