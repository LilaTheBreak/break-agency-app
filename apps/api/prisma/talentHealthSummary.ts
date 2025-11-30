import { aiClient } from './aiClient.js';

const summaryPrompt = (snapshot: any) => `
Based on the following talent health snapshot, provide a concise summary and 2-3 actionable recommendations.

Snapshot: ${JSON.stringify(snapshot, null, 2)}

Recommendations should be specific (e.g., "Reschedule the photoshoot on Friday to reduce travel load").
Respond with JSON: { "summary": "string", "recommendations": ["string"] }
`;

/**
 * Generates a summary and recommendations based on a talent's health snapshot.
 * @param snapshot - The complete talent health snapshot object.
 * @returns A promise that resolves to an object with a summary and a list of recommendations.
 */
export async function generateHealthSummary(snapshot: any) {
  try {
    const prompt = summaryPrompt(snapshot);
    return await aiClient.json(prompt) as { summary: string; recommendations: string[] };
  } catch (error) {
    console.error('[AI HEALTH SUMMARY ERROR]', error);
    return { summary: 'AI summary is currently unavailable. Please review metrics manually.', recommendations: ['Check calendar for conflicts.'] };
  }
}