import prisma from "../../lib/prisma.js";
import { randomUUID } from "crypto";

// In case your AI module isn't ready yet, use a safe fallback.
async function generateAISummarySafe(messages: string[]) {
  try {
    // TODO: replace with your real AI service when ready
    const text = messages.join("\n").slice(0, 2000);
    return `AI summary placeholder: Conversation contains ${messages.length} messages.`;
  } catch (err) {
    console.error("AI summary generation failed:", err);
    return null;
  }
}

export const threadService = {
  /**
   * Fetch a thread & its metadata
   */
  async getThreadById(threadId: string) {
    return prisma.inboxMessage.findUnique({
      where: { threadId },
      include: {
        InboundEmail: {
          orderBy: { receivedAt: "asc" }
        },
        InboxThreadMeta: true
      }
    });
  },

  /**
   * Return all individual email messages in this thread
   */
  async getThreadMessages(threadId: string) {
    return prisma.inboundEmail.findMany({
      where: { threadId },
      orderBy: { receivedAt: "asc" }
    });
  },

  /**
   * Returns the stored AI summary for a thread
   */
  async getThreadSummary(threadId: string) {
    const meta = await prisma.inboxThreadMeta.findUnique({
      where: { threadId }
    });
    return meta?.aiThreadSummary ?? null;
  },

  /**
   * Regenerate AI summary for a thread and store it
   */
  async updateThreadSummary(threadId: string) {
    const messages = await prisma.inboundEmail.findMany({
      where: { threadId },
      select: { body: true, subject: true },
      orderBy: { receivedAt: "asc" }
    });

    const messageStrings = messages.map(
      (m) => `Subject: ${m.subject ?? ""}\n${m.body ?? ""}`
    );

    const aiSummary = await generateAISummarySafe(messageStrings);

    return prisma.inboxThreadMeta.upsert({
      where: { threadId },
      create: {
        id: randomUUID(),
        threadId,
        userId: "", // You may attach user context if needed
        aiThreadSummary: aiSummary,
        unreadCount: 0
      },
      update: {
        aiThreadSummary: aiSummary
      }
    });
  },

  /**
   * Mark all messages in the thread as read, and update unread count
   */
  async markThreadRead(threadId: string) {
    await prisma.inboundEmail.updateMany({
      where: { threadId },
      data: { isRead: true }
    });

    await prisma.inboxThreadMeta.updateMany({
      where: { threadId },
      data: { unreadCount: 0 }
    });

    return { success: true };
  },

  /**
   * Link thread → deal for CRM context (used in analytics / insights)
   */
  async linkThreadToDeal(threadId: string, dealId: string) {
    return prisma.inboxThreadMeta.update({
      where: { threadId },
      data: { linkedDealId: dealId }
    });
  },

  /**
   * Recalculate analytics: unread count, last message date, priority score
   */
  async resyncThreadAnalytics(threadId: string) {
    const emails = await prisma.inboundEmail.findMany({
      where: { threadId },
      orderBy: { receivedAt: "desc" }
    });

    const unreadCount = emails.filter((e) => !e.isRead).length;
    const lastMessageAt = emails[0]?.receivedAt ?? new Date();

    return prisma.inboxThreadMeta.upsert({
      where: { threadId },
      create: {
        id: randomUUID(),
        threadId,
        userId: "", // assign when user context is added
        unreadCount,
        lastMessageAt
      },
      update: {
        unreadCount,
        lastMessageAt
      }
    });
  }
};

export default threadService;

// Export individual functions for controller use
export async function listUnifiedThreads({ userId, page = 1, limit = 25 }: { userId: string; page?: number; limit?: number }) {
  const skip = (page - 1) * limit;
  
  try {
    const threads = await prisma.inboxMessage.findMany({
      where: { userId },
      include: {
        InboxThreadMeta: true,
        InboundEmail: {
          orderBy: { receivedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.inboxMessage.count({
      where: { userId }
    });

    return {
      threads: threads.map(thread => ({
        id: thread.threadId,
        subject: thread.subject,
        participants: thread.participants,
        lastMessageAt: thread.lastMessageAt,
        unreadCount: thread.InboxThreadMeta?.unreadCount || 0,
        isRead: thread.isRead,
        priority: thread.InboxThreadMeta?.priority || 0,
        aiSummary: thread.InboxThreadMeta?.aiThreadSummary,
        snippet: thread.snippet
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error listing threads:', error);
    // Return empty result instead of throwing
    return {
      threads: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }
}

export async function getUnifiedThreadById(threadId: string, userId: string) {
  try {
    const thread = await prisma.inboxMessage.findFirst({
      where: {
        threadId,
        userId
      },
      include: {
        InboxThreadMeta: true,
        InboundEmail: {
          orderBy: { receivedAt: 'asc' }
        }
      }
    });

    if (!thread) return null;

    return {
      id: thread.threadId,
      subject: thread.subject,
      participants: thread.participants,
      messages: thread.InboundEmail,
      unreadCount: thread.InboxThreadMeta?.unreadCount || 0,
      aiSummary: thread.InboxThreadMeta?.aiThreadSummary,
      linkedDealId: thread.InboxThreadMeta?.linkedDealId,
      snippet: thread.snippet,
      isRead: thread.isRead,
      lastMessageAt: thread.lastMessageAt
    };
  } catch (error) {
    console.error('Error getting thread by ID:', error);
    return null;
  }
}

export async function getMessagesForThread(threadId: string, userId: string) {
  try {
    const thread = await prisma.inboxMessage.findFirst({
      where: {
        threadId,
        userId
      }
    });

    if (!thread) return null;

    const messages = await prisma.inboundEmail.findMany({
      where: { threadId },
      orderBy: { receivedAt: 'asc' }
    });

    return messages;
  } catch (error) {
    console.error('Error getting messages for thread:', error);
    return null;
  }
}

export async function sendReplyToThread(threadId: string, userId: string, body: string) {
  try {
    // Get thread details
    const thread = await prisma.inboxMessage.findFirst({
      where: {
        threadId,
        userId
      }
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Create outbound email record
    const reply = await prisma.inboundEmail.create({
      data: {
        id: randomUUID(),
        userId,
        fromEmail: user.email,
        toEmail: thread.participants[0] || '',
        subject: thread.subject ? `Re: ${thread.subject}` : 'Re: (no subject)',
        body,
        threadId,
        receivedAt: new Date(),
        direction: 'outbound',
        isRead: true
      }
    });

    // Update thread's last message time
    await prisma.inboxMessage.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date()
      }
    });

    return reply;
  } catch (error) {
    console.error('Error sending reply:', error);
    throw error;
  }
}