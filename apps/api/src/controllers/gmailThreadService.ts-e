import prisma from '../db/client';

/**
 * Fetches a Gmail thread (InboxMessage) and its associated metadata.
 * @param threadId - The Gmail thread ID.
 * @param userId - The ID of the user.
 * @returns The InboxMessage object with its metadata, or null if not found.
 */
export async function getGmailThread(threadId: string, userId: string) {
  return prisma.inboxMessage.findFirst({
    where: { threadId, userId },
    include: {
      InboxThreadMeta: true // Include the unified metadata
    }
  });
}

/**
 * Fetches all individual emails (InboundEmail) for a given Gmail thread ID.
 * @param threadId - The Gmail thread ID.
 * @param userId - The ID of the user.
 * @returns An array of InboundEmail objects.
 */
export async function getGmailMessagesForThread(threadId: string, userId:string) {
    const thread = await prisma.inboxMessage.findFirst({
        where: { threadId, userId }
    });

    if (!thread) {
        return [];
    }

    return prisma.inboundEmail.findMany({
        where: { inboxMessageId: thread.id },
        orderBy: { receivedAt: 'asc' }
    });
}