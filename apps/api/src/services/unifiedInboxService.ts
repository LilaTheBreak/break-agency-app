// apps/api/src/services/unifiedInboxService.ts

import prisma from "../lib/prisma.js";
import { computePrioritySignals } from "./priorityEngine.js";

type Priority = "high" | "medium" | "low";

type UnifiedInboxItem = {
  id: string;
  platform: string;
  parsed: {
    id: string;
    from: string | null;
    to: string | null;
    subject: string | null;
    date: string | null;
    body: string;
  };
  scoring: {
    score: number;
    labels: string[];
    reasons: string[];
    isOpportunity: boolean;
  };
  priority: Priority;
  aiSummary?: string | null;
  classifications?: any[];
  linkedDeals?: any[];
};

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2
};

/************************************
 * EMAIL MAPPER
 ************************************/
function mapEmail(email: any): UnifiedInboxItem {
  const parsed = {
    id: email.id,
    from: email.fromEmail ?? null,
    to: email.toEmail ?? null,
    subject: email.subject ?? null,
    date: email.receivedAt ? email.receivedAt.toISOString() : null,
    body: email.body ?? ""
  };

  const prioritySignals = computePrioritySignals({
    parsed,
    aiCategory: email.classifications?.[0]?.type, // Assuming first classification is primary
    linkedDealId: (email.metadata as any)?.dealDraftId,
    receivedAt: email.receivedAt?.toISOString(),
  });

  return {
    id: email.id,
    platform: "email",
    parsed,
    scoring: {
      score: prioritySignals.score,
      labels: email.categories ?? [],
      reasons: prioritySignals.reasons,
      isOpportunity: prioritySignals.score >= 30,
    },
    priority: prioritySignals.priority,
    aiSummary: email.aiSummary ?? null,
    classifications: email.classifications ?? [],
    linkedDeals: email.linkedDeals ?? []
  };
}

/************************************
 * MESSAGE (DM) MAPPER
 ************************************/
function mapMessage(msg: any): UnifiedInboxItem {
  const parsed = {
    id: msg.id,
    from: msg.sender ?? msg.senderEmail ?? null,
    to: null,
    subject: `Message from ${msg.sender ?? "Unknown Sender"}`,
    date: msg.receivedAt ? msg.receivedAt.toISOString() : null,
    body: msg.body ?? ""
  };

  const prioritySignals = computePrioritySignals({
    parsed,
    aiCategory: msg.classified?.[0]?.type,
    linkedDealId: msg.linkedDeals?.[0]?.dealId,
    receivedAt: msg.receivedAt?.toISOString(),
  });

  return {
    id: msg.id,
    platform: msg.source ?? "dm",
    parsed,
    scoring: {
      score: prioritySignals.score,
      labels: msg.classified?.map(c => c.type) ?? [],
      reasons: prioritySignals.reasons,
      isOpportunity: prioritySignals.score >= 30,
    },
    priority: prioritySignals.priority,
    aiSummary: msg.aiSummary ?? null,
    classifications: msg.classified ?? [],
    linkedDeals: msg.linkedDeals ?? []
  };
}

/************************************
 * MAIN FETCHER
 ************************************/
export async function fetchUnifiedInbox(userId: string) {
  // 1. Fetch EMAILS from InboundEmail
  const emails = await prisma.inboundEmail.findMany({
    where: { userId },
    // No includes needed as per new logic, simplifying the query
    orderBy: { receivedAt: "desc" },
    take: 50
  });

  // 2. Fetch DM messages from InboxMessage
  const messages = await prisma.inboxMessage.findMany({
    where: {
      userId: userId, // Correctly filter DMs for the user
    },
    include: {
      classified: true,
      linkedDeals: true
    },
    orderBy: { receivedAt: "desc" },
    take: 50
  });

  const emailItems = emails.map(mapEmail);
  const messageItems = messages.map(mapMessage);

  // MERGE + SORT
  const inbox = [...emailItems, ...messageItems].sort((a, b) => {
    const pA = PRIORITY_ORDER[a.priority];
    const pB = PRIORITY_ORDER[b.priority];
    if (pA !== pB) return pA - pB; // Sort by high/medium/low

    if (a.scoring.score !== b.scoring.score) return b.scoring.score - a.scoring.score; // Then by score descending
    
    const tA = a.parsed.date ? new Date(a.parsed.date).getTime() : 0;
    const tB = b.parsed.date ? new Date(b.parsed.date).getTime() : 0;
    return tB - tA;
  });

  const totals = {
    high: inbox.filter((i) => i.priority === "high").length,
    medium: inbox.filter((i) => i.priority === "medium").length,
    low: inbox.filter((i) => i.priority === "low").length
  };

  return { ok: true, inbox, totals };
}
