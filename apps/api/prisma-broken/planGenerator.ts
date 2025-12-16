import { aiClient } from './aiClient.js';

const planPrompt = (context: any) => `
You are a campaign manager AI. Based on the provided creative brief, generate a high-level campaign auto-plan.

Brief: ${JSON.stringify(context.brief)}

Include a timeline, a list of deliverables, and a budget breakdown.
Respond with JSON: { "timeline": [{ "week": number, "title": "string", "description": "string" }], "deliverables": [{ "creatorId": "string", "platform": "string", "type": "string" }], "budget": { "total": number, "breakdown": [{ "item": "string", "amount": number }] } }
`;

/**
 * Generates a full campaign auto-plan from a brief.
 */
export async function generateAutoPlan(context: { brief: any }) {
  try {
    const prompt = planPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI PLAN GENERATOR ERROR]', error);
    return {
      timeline: [{ week: 1, title: 'Kick-off (Stub)', description: 'Initial planning meeting.' }],
    };
  }
}