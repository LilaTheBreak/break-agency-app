import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

interface FollowUpContext {
  threadId: string;
  // In a real app, you'd pass more context like brand info, talent persona, etc.
}

const writerPrompt = (context: any) => `
You are an expert talent manager's assistant. Write a short, warm, and low-friction follow-up email.

**Deal Context:**
${JSON.stringify(context.deal, null, 2)}

**Last Message in Thread:**
"""
${context.lastMessage}
"""

Your goal is to gently bump the conversation and get a reply. Keep it brief and professional.
Respond with a JSON object containing the subject and body: { "subject": "...", "body": "..." }
`;

/**
 * Generates a follow-up email using AI.
 * @param context - The context required to generate the email.
 * @returns The generated subject and body.
 */
export async function generateFollowUpEmail(context: FollowUpContext) {
  const dealThread = await prisma.dealThread.findUnique({
    where: { id: context.threadId },
    include: { emails: { orderBy: { receivedAt: 'desc' }, take: 1 } },
  });

  if (!dealThread || dealThread.emails.length === 0) {
    throw new Error('Could not find thread or last email to generate follow-up.');
  }

  const prompt = writerPrompt({ deal: dealThread, lastMessage: dealThread.emails[0].snippet });
  const result = await aiClient.json(prompt) as { subject: string; body: string };
  return result;
}