import { aiClient } from './aiClient.js';

const workloadPrompt = (context: any) => `
Analyze the following workload data for a talent and provide a score from 0 (no load) to 100 (extreme overload).
Consider the number of events, deliverable deadlines, and active negotiations.

Data: ${JSON.stringify(context, null, 2)}

Respond with JSON: { "workloadScore": number }
`;

/**
 * Scores the current workload of a talent based on their schedule and tasks.
 * @param context - Object containing lists of events, deliverables, etc.
 * @returns A promise that resolves to an object containing the workload score.
 */
export async function scoreWorkload(context: any) {
  try {
    const prompt = workloadPrompt(context);
    return await aiClient.json(prompt) as { workloadScore: number };
  } catch (error) {
    console.error('[AI WORKLOAD SCORER ERROR]', error);
    return { workloadScore: 50 }; // Fallback score
  }
}