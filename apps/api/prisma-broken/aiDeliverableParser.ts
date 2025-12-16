import { aiClient } from '../../services/ai/aiClient.js';

const planGeneratorPrompt = (contractText: string) => `
You are an AI Project Manager for a talent agency. Your task is to read a finalized contract and generate a complete project plan.

**Contract Text:**
---
${contractText}
---

**Instructions:**
Based on the contract, generate a structured JSON project plan.
1.  **Deliverables**: List each distinct deliverable (e.g., "1x Instagram Post", "1x YouTube Video").
2.  **Timeline**: Create a timeline with key stages for the campaign (e.g., "Kick-off Call", "First Draft Due", "Final Content Approval", "Go-Live Date"). Estimate realistic dates for each stage, starting from today.
3.  **Tasks**: Create a list of tasks for both the creator and the internal agent team to execute this plan.

**JSON Output Schema:**
{
  "deliverables": [
    { "type": "string (e.g., 'Instagram Post')", "description": "string", "platform": "string" }
  ],
  "timeline": [
    { "stage": "string", "date": "ISO_8601_Date", "notes": "string" }
  ],
  "creatorTasks": [
    { "task": "string", "dueDate": "ISO_8601_Date" }
  ],
  "agentTasks": [
    { "task": "string", "dueDate": "ISO_8601_Date" }
  ]
}
`;

/**
 * Uses AI to parse a contract and generate a structured project plan.
 * @param contractText - The full text of the contract.
 */
export async function parseContractForPlan(contractText: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[AI PARSER STUB] OPENAI_API_KEY not found. Returning stubbed plan.');
    return { deliverables: [{ type: 'Instagram Post', description: 'Stubbed from AI Parser' }], timeline: [], creatorTasks: [], agentTasks: [] };
  }

  try {
    const prompt = planGeneratorPrompt(contractText);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI DELIVERABLE PARSER ERROR]', error);
    throw new Error('Failed to generate plan with AI.');
  }
}