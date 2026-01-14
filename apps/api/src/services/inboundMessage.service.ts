import prisma from '../lib/prisma.js';
import { classifyMessage } from './ai/messageClassifier.js';

const FOLLOW_UP_PATTERNS = [
  /just emailed you/i,
  /following up on our email/i,
  /emailed you/i,
  /messaged your team/i,
  /sent you an email/i
];

function mentionsEmail(text?: string) {
  if (!text) return false;
  return FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text));
}

export async function ingestDM({
  userId,
  platform,
  message,
}: {
  userId: string;
  platform: string;
  message: {
    externalId?: string;
    senderHandle?: string;
    senderName?: string;
    senderImage?: string;
    message: string;
    raw?: any;
  };
}) {
  // TODO: Implement proper DM ingestion once message data structure is finalized
  // For now, this creates a basic InboundEmail record
  try {
    const record = await prisma.inboundEmail.create({
      data: {
        id: `inbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        platform,
        fromEmail: message.senderHandle || "unknown@unknown.com",
        toEmail: "",
        body: message.message,
        snippet: message.message.substring(0, 100),
        aiCategory: (message.raw as any)?.category || "general",
        aiUrgency: (message.raw as any)?.urgency || "normal",
        aiRecommendedAction: (message.raw as any)?.action,
      },
    });

    return record;
  } catch (error) {
    console.error("[IngestDM] Error ingesting message:", error);
    throw error;
  }
}
