import prisma from "../../lib/prisma.js";

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
        emails: {
          orderBy: { receivedAt: "asc" }
        },
        threadMeta: true
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
