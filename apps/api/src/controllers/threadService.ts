import prisma from "../../db/client.js";
import { getGmailThread, getGmailMessagesForThread } from "./gmailThreadService.js";

interface ListThreadsOptions {
  userId: string;
  page: number;
  limit: number;
}

/**
 * Lists all unified threads for a user, starting with Gmail threads.
 * In a real system, this would merge data from multiple sources (Gmail, DMs, etc.).
 * @param options - Pagination and user information.
 * @returns A paginated list of unified threads.
 */
export async function listUnifiedThreads(options: ListThreadsOptions) {
  const { userId, page, limit } = options;

  // 1. Fetch the base threads from InboxMessage (our source of truth for Gmail threads)
  const inboxMessages = await prisma.inboxMessage.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      // Include metadata if it exists
      threadMeta: true
    }
  });

  // 2. Map to a unified structure
  const unifiedThreads = inboxMessages.map((thread) => {
    const meta = thread.threadMeta;
    return {
      threadId: thread.threadId,
      platform: "gmail", // Inferred from the source table
      subject: thread.subject,
      lastMessageAt: meta?.lastMessageAt || thread.lastMessageAt,
      lastMessagePreview: thread.snippet,
      unreadCount: meta?.unreadCount ?? (thread.isRead ? 0 : 1), // Simplified logic
      priority: meta?.priority ?? 0,
      linkedDealId: meta?.linkedDealId,
      aiThreadSummary: meta?.aiThreadSummary,
      participants: thread.participants
    };
  });

  // In the future, you would fetch DM threads here and merge/sort them
  // with the `unifiedThreads` array before returning.

  return unifiedThreads;
}

/**
 * Gets the full details for a single unified thread by its ID.
 * @param threadId - The unique ID of the thread (e.g., Gmail thread ID).
 * @param userId - The ID of the user requesting the thread.
 * @returns A single unified thread object or null if not found.
 */
export async function getUnifiedThreadById(threadId: string, userId: string) {
  // For now, we assume the threadId corresponds to a Gmail thread
  const gmailThread = await getGmailThread(threadId, userId);
  if (!gmailThread) {
    // In the future, you would check for DM threads here
    return null;
  }

  const meta = gmailThread.threadMeta;
  return {
    threadId: gmailThread.threadId,
    platform: "gmail",
    subject: gmailThread.subject,
    lastMessageAt: meta?.lastMessageAt || gmailThread.lastMessageAt,
    unreadCount: meta?.unreadCount ?? (gmailThread.isRead ? 0 : 1),
    priority: meta?.priority ?? 0,
    linkedDealId: meta?.linkedDealId,
    aiThreadSummary: meta?.aiThreadSummary,
    participants: gmailThread.participants
  };
}

/**
 * Gets all messages for a given thread ID.
 * @param threadId - The unique ID of the thread.
 * @param userId - The ID of the user.
 * @returns An array of all messages in the thread, or null if the thread is not found.
 */
export async function getMessagesForThread(threadId: string, userId: string) {
  // Check which platform this thread belongs to. Start with Gmail.
  const isGmailThread = await prisma.inboxMessage.findFirst({
    where: { threadId, userId }
  });

  if (isGmailThread) {
    return getGmailMessagesForThread(threadId, userId);
  }

  // In the future, check for DM threads here.
  // const isDmThread = await prisma.dmThread.findFirst(...);
  // if (isDmThread) { ... }

  return null;
}