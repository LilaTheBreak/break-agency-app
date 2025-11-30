import prisma from "../lib/prisma.js";
import { scoreEmail } from "./opportunityScoring.js";

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
    isOpportunity: boolean;
  };
  priority: Priority;
  aiCategory?: string | null;
  aiBrand?: string | null;
  aiUrgency?: string | null;
  aiRecommendedAction?: string | null;
  aiConfidence?: number | null;
  aiJson?: any;
  aiSummary?: string | null;
  linkedEmailId?: string | null;
  linkedDealId?: string | null;
  externalId?: string | null;
};

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function toPriority(score: number): Priority {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function mapEmail(email: any): UnifiedInboxItem {
  const parsed = {
    id: email.id,
    from: email.from || null,
    to: email.to || null,
    subject: email.subject || null,
    date: email.receivedAt ? new Date(email.receivedAt).toISOString() : null,
    body: email.body || email.snippet || ""
  };
  const scoring = scoreEmail(parsed);
  const priority = toPriority(scoring.score);
  return {
    id: email.id,
    platform: "email",
    parsed,
    scoring,
    priority,
    aiCategory: email.aiCategory,
    aiBrand: email.aiBrand,
    aiUrgency: email.aiUrgency,
    aiRecommendedAction: email.aiRecommendedAction,
    aiConfidence: email.aiConfidence,
    aiJson: email.aiJson,
    aiSummary: email.aiSummary,
    linkedEmailId: null,
    linkedDealId: email.dealDraftId || null,
    externalId: null
  };
}

function mapMessage(message: any): UnifiedInboxItem {
  const parsed = {
    id: message.id,
    from: message.senderHandle || message.senderName || message.platform || null,
    to: null,
    subject:
      message.senderName || message.senderHandle
        ? `DM from ${message.senderName || message.senderHandle}`
        : `${message.platform} message`,
    date: message.receivedAt ? new Date(message.receivedAt).toISOString() : null,
    body: message.message || ""
  };
  const scoring = scoreEmail(parsed);
  const priority = toPriority(scoring.score);
  return {
    id: message.id,
    platform: message.platform || "dm",
    parsed,
    scoring,
    priority,
    aiCategory: message.aiCategory,
    aiBrand: message.aiBrand,
    aiUrgency: message.aiUrgency,
    aiRecommendedAction: message.aiRecommendedAction,
    aiConfidence: message.aiConfidence,
    aiJson: message.aiJson,
    aiSummary: message.aiSummary,
    linkedEmailId: message.linkedEmailId,
    linkedDealId: message.linkedDealId,
    externalId: message.externalId
  };
}

export async function fetchUnifiedInbox(userId: string) {
  const [emails, messages] = await Promise.all([
    prisma.inboundEmail.findMany({
      where: { userId },
      orderBy: { receivedAt: "desc" },
      take: 50
    }),
    prisma.inboundMessage.findMany({
      where: { userId },
      orderBy: { receivedAt: "desc" },
      take: 50
    })
  ]);

  const emailItems = emails.map(mapEmail);
  const messageItems = messages.map(mapMessage);
  const inbox = [...emailItems, ...messageItems].sort((a, b) => {
    const rankDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (rankDiff !== 0) return rankDiff;
    const dateA = a.parsed.date ? new Date(a.parsed.date).getTime() : 0;
    const dateB = b.parsed.date ? new Date(b.parsed.date).getTime() : 0;
    return dateB - dateA;
  });

  const totals = {
    high: inbox.filter((i) => i.priority === "high").length,
    medium: inbox.filter((i) => i.priority === "medium").length,
    low: inbox.filter((i) => i.priority === "low").length
  };

  return { inbox, totals };
}
