import prisma from '../../lib/prisma.js';
import { Prisma } from "@prisma/client";

interface FetchInboxOptions {
  userId: string;
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

/**
 * Fetches a paginated list of inbox threads from the database.
 * @param options - Options for fetching the inbox.
 * @returns A promise that resolves to a list of inbox threads.
 */
export async function fetchInboxThreads(options: FetchInboxOptions) {
  const { userId, page, limit, unreadOnly = false } = options;

  const where: Prisma.InboxMessageWhereInput = {
    userId,
    ...(unreadOnly && { isRead: false })
  };

  const threads = await prisma.inboxMessage.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      // Include only the most recent email for a lightweight list view
      InboundEmail: {
        orderBy: { receivedAt: "desc" },
        take: 1
      }
    }
  });

  return threads;
}

/**
 * Fetches the full details of a single thread, including all its emails.
 * @param userId - The ID of the user.
 * @param threadId - The Gmail thread ID.
 * @returns A promise that resolves to the full thread object or null if not found.
 */
export async function fetchThreadDetails(userId: string, threadId: string) {
  const thread = await prisma.inboxMessage.findFirst({
    where: { userId, threadId },
    include: {
      // Include all emails, sorted chronologically
      InboundEmail: {
        orderBy: { receivedAt: "asc" }
      }
    }
  });

  return thread;
}

/**
 * Searches for threads in the database based on a query string.
 * This performs a simple search on subject and snippet. For more advanced
 * searching, consider Prisma's full-text search capabilities.
 * @param userId - The ID of the user.
 * @param query - The search query.
 * @returns A promise that resolves to a list of matching threads.
 */
export async function searchThreads(userId: string, query: string) {
  const threads = await prisma.inboxMessage.findMany({
    where: {
      userId,
      OR: [
        {
          subject: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          snippet: {
            contains: query,
            mode: "insensitive"
          }
        }
      ]
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50 // Limit search results
  });

  return threads;
}