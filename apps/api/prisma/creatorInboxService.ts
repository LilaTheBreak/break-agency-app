import prisma from '../../lib/prisma.js';
import { summariseCreatorEmail } from '../ai/agents/creatorAgent.js';

/**
 * Fetches and summarizes a prioritized inbox view for a creator.
 * @param userId - The ID of the creator.
 */
export async function getCreatorInbox(userId: string) {
  const emails = await prisma.inboundEmail.findMany({
    where: { userId },
    orderBy: { aiPriority: 'desc' }, // Order by AI-assigned priority
    take: 20,
  });

  // Augment with AI summaries
  const summarizedEmails = await Promise.all(
    emails.map(async (email) => {
      const { summary } = await summariseCreatorEmail(email.body || email.snippet || '');
      return { ...email, aiSummary: summary };
    })
  );

  return summarizedEmails;
}