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

  let linkedEmailId: string | undefined;
  let linkedDealId: string | undefined;

  if (mentionsEmail(record.message)) {
    const brandName = ai?.brand || message.senderName || message.senderHandle;
    if (brandName) {
      const emailMatch = await prisma.inboundEmail.findFirst({
        where: {
          userId,
          subject: {
            contains: brandName,
            mode: "insensitive"
          }
        },
        orderBy: { receivedAt: "desc" }
      });
      if (emailMatch) {
        linkedEmailId = emailMatch.id;
        const deal = await prisma.dealThread.findFirst({
          where: {
            userId: emailMatch.userId,
            OR: [
              { brandName: { contains: brandName, mode: "insensitive" } },
              emailMatch.from
                ? {
                    brandEmail: {
                      equals: emailMatch.from,
                      mode: "insensitive"
                    }
                  }
                : undefined
            ].filter(Boolean) as any
          }
        });
        if (deal) {
          linkedDealId = deal.id;
        }
      }
    }
  }

  await prisma.inboundMessage.update({
    where: { id: record.id },
    data: {
      aiCategory: ai?.category,
      aiBrand: ai?.brand,
      aiUrgency: ai?.urgency,
      aiRecommendedAction: ai?.action,
      aiConfidence: ai?.confidence,
      aiJson: ai?.raw,
      linkedEmailId,
      linkedDealId
    },
  });

  return record;
}
