import { aiClient } from './aiClient.js';

const rsvpPrompt = (context: { eventTitle: string; status: 'accept' | 'decline'; reason?: string }) => `
You are a professional talent manager's assistant. Write a polite and concise RSVP email.

Event: "${context.eventTitle}"
Action: ${context.status}
${context.reason ? `Reason: ${context.reason}` : ''}

Generate a subject and body for the email.
Respond with JSON: { "subject": "...", "body": "..." }
`;

/**
 * Generates an RSVP email body and subject using AI.
 * @param context - The event details and the RSVP action.
 * @returns The generated subject and body.
 */
export async function generateRsvpEmail(context: { eventTitle: string; status: 'accept' | 'decline'; reason?: string }) {
  const prompt = rsvpPrompt(context);
  const result = await aiClient.json(prompt);
  return result as { subject: string; body: string };
}