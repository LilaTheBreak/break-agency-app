import prisma from "../lib/prisma.js";
import { scoreEmail } from "./priorityEngine.js";

const PRIORITY_CATEGORIES = ["deal", "negotiation", "brief", "invite", "gifting"];

interface PriorityReason {
  isHighScore: boolean;
  hasDeadline: boolean;
  dealCategory: boolean;
  unreadReply: boolean;
  linkedDeal: boolean;
}

interface PriorityItem {
  id: string;
  type: "email" | "dm";
  priorityScore: number;
  reason: PriorityReason;
  receivedAt: Date;
  parsed: {
    id: string;
    from: string;
    to?: string;
    subject?: string | null;
    date: Date;
    body?: string | null;
  };
}

async function processEmails(userId: string): Promise<PriorityItem[]> {
  const emails = await prisma.inboundEmail.findMany({
    where: { userId },
    orderBy: { receivedAt: "desc" },
    take: 200, // Limit to recent emails for performance
  });

  const priorityItems: PriorityItem[] = [];

  for (const email of emails) {
    const parsed = {
      id: email.id,
      from: email.fromEmail,
      to: email.toEmail,
      subject: email.subject,
      date: email.receivedAt,
      body: email.body,
    };

    const aiScore = await scoreEmail(parsed);
    const reason: PriorityReason = {
      isHighScore: aiScore >= 60,
      hasDeadline: !!(email.metadata as any)?.deadline,
      dealCategory: email.categories.some(cat => PRIORITY_CATEGORIES.includes(cat)),
      unreadReply: !email.isRead, // Simplified: unread is a form of priority
      linkedDeal: !!(email.metadata as any)?.dealDraftId,
    };

    const isPriority = Object.values(reason).some(Boolean);

    if (isPriority) {
      let priorityScore = aiScore;
      if (reason.hasDeadline) priorityScore += 20;
      if (reason.dealCategory) priorityScore += 15;
      if (reason.unreadReply) priorityScore += 5;
      if (reason.linkedDeal) priorityScore += 25;

      priorityItems.push({
        id: email.id,
        type: "email",
        priorityScore,
        reason,
        receivedAt: email.receivedAt,
        parsed,
      });
    }
  }
  return priorityItems;
}

async function processDMs(userId: string): Promise<PriorityItem[]> {
  const dms = await prisma.inboxMessage.findMany({
    where: { userId },
    include: { InboxThreadMeta: true },
    orderBy: { receivedAt: "desc" },
    take: 200,
  });

  const priorityItems: PriorityItem[] = [];

  for (const dm of dms) {
    const threadMeta = dm.InboxThreadMeta;
    const reason: PriorityReason = {
      isHighScore: threadMeta?.priority === 2, // High priority from initial classification
      hasDeadline: false, // Would require classification table
      dealCategory: false, // Would require classification table
      unreadReply: !dm.isRead,
      linkedDeal: !!threadMeta?.linkedDealId,
    };

    const isPriority = Object.values(reason).some(Boolean);

    if (isPriority) {
      let priorityScore = (threadMeta?.priority || 0) * 40; // Scale 0-2 to 0-80
      if (reason.hasDeadline) priorityScore += 20;
      if (reason.dealCategory) priorityScore += 15;
      if (reason.unreadReply) priorityScore += 5;
      if (reason.linkedDeal) priorityScore += 25;

      priorityItems.push({
        id: dm.id,
        type: "dm",
        priorityScore,
        reason,
        receivedAt: dm.receivedAt,
        parsed: {
          id: dm.id,
          from: dm.sender,
          subject: dm.subject,
          date: dm.receivedAt,
          body: dm.body,
        },
      });
    }
  }
  return priorityItems;
}

export async function fetchPriorityFeed(userId: string): Promise<PriorityItem[]> {
  const [emailItems, dmItems] = await Promise.all([
    processEmails(userId),
    processDMs(userId),
  ]);

  const combined = [...emailItems, ...dmItems];

  // Sort by highest priority score, then by newest first
  return combined.sort((a, b) => b.priorityScore - a.priorityScore || b.receivedAt.getTime() - a.receivedAt.getTime());
}
