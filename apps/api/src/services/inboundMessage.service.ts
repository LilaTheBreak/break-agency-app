import prisma from "../lib/prisma.js";
import { classifyMessage } from "./ai/messageClassifier.js";

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
  const record = await prisma.inboundMessage.create({
    data: {
      userId,
      platform,
      externalId: message.externalId,
      senderHandle: message.senderHandle,
      senderName: message.senderName,
      senderImage: message.senderImage,
      message: message.message,
      rawData: message.raw,
    },
  });

  const ai = await classifyMessage({
    text: record.message,
    platform,
  });

  await prisma.inboundMessage.update({
    where: { id: record.id },
    data: {
      aiCategory: (ai as any)?.category,
      aiBrand: (ai as any)?.brand,
      aiUrgency: (ai as any)?.urgency,
      aiRecommendedAction: (ai as any)?.action,
      aiConfidence: (ai as any)?.confidence,
      aiJson: (ai as any)?.raw,
    },
  });

  return record;
}
