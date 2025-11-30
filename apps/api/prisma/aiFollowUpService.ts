import { aiClient } from './aiClient.js';

const followUpPrompt = (context: {
  brandName: string;
  deliverableType: string;
  followUpCount: number;
}) => `
You are an AI assistant for a talent agent. Your task is to draft a polite but effective follow-up email to a brand that has not responded to a deliverable approval request.

**Context:**
- **Brand Name:** ${context.brandName}
- **Deliverable:** ${context.deliverableType}
- **Follow-up Attempt:** #${context.followUpCount + 1}

**Instructions:**
Draft a short, friendly, and professional email.
- For the first follow-up, be very gentle ("Just wanted to gently bump this up in your inbox...").
- For subsequent follow-ups, be slightly more direct ("Following up on the below, please let us know if you have any feedback...").

**JSON Output Schema:**
{ "subject": "string", "body": "string" }
`;

/**
 * Generates a brand follow-up email using AI.
 */
export async function generateBrandFollowUp(context: any) {
  const prompt = followUpPrompt(context);
  return aiClient.json(prompt).catch(() => ({
    subject: `Following up on the ${context.deliverableType}`,
    body: 'Hi team, just wanted to gently follow up on the deliverable we sent over for review. Please let us know if you have any feedback. Thanks!',
  }));
}