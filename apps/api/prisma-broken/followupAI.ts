import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const followupPrompt = (lastMessage: string, brandPersona?: string) => `
Given the last email in a thread, generate a concise and effective follow-up email.

**Last Message Sent:**
---
${lastMessage}
---

**Brand Persona (optional):**
${brandPersona || 'Not specified.'}

Generate a short, polite follow-up to bump the conversation.
Your response should be a JSON object with a single key "followupText".
`;

/**
 * Generates an AI-powered follow-up email for a given thread.
 * @param threadId The ID of the DealThread.
 * @returns The generated follow-up text.
 */
export async function generateFollowUp(threadId: string): Promise<string> {
  const thread = await prisma.dealThread.findUnique({
    where: { id: threadId },
    include: { emails: { orderBy: { receivedAt: 'desc' }, take: 1 } },
  });

  if (!thread || thread.emails.length === 0) {
    throw new Error('Thread or last email not found.');
  }

  const lastEmail = thread.emails[0];
  const prompt = followupPrompt(lastEmail.snippet || '');
  const result = await aiClient.json(prompt) as { followupText: string };

  return result.followupText;
}