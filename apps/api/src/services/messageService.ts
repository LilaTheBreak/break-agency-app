import prisma from '../lib/prisma';
import { InboundEmail } from "@prisma/client";
import createHttpError from "http-errors";
import { sendEmailWithGmail } from './email/sendOutbound'; // Ensure this is implemented!



/**
 * Format email for API output
 */
function formatMessage(email: InboundEmail): any {
  return {
    id: email.id,
    threadId: email.threadId,
    platform: "email",
    from: email.fromEmail,
    to: email.toEmail,
    subject: email.subject,
    body: email.body,
    date: email.receivedAt,
    isRead: email.isRead,
    ai: {
      summary: (email as any).aiSummary,
      category: (email as any).aiCategory,
      urgency: (email as any).aiUrgency,
      recommendedAction: (email as any).aiRecommendedAction,
      confidence: (email as any).aiConfidence,
      raw: (email as any).aiJson,
    }
  };
}



/**
 * Get latest messages
 */
export async function listRecentMessages(userId: string) {
  const emails = await prisma.inboundEmail.findMany({
    where: { userId },
    orderBy: { receivedAt: "desc" },
    take: 100
  });

  return emails.map(formatMessage);
}



/**
 * Fetch one message
 */
export async function getMessageById(messageId: string, userId: string) {
  const email = await prisma.inboundEmail.findFirst({
    where: { id: messageId, userId }
  });

  return email ? formatMessage(email) : null;
}



const MAX_EMAILS_PER_MINUTE = 20;
const MAX_EMAILS_PER_DAY = 200;

/**
 * Send outbound message safely
 */
export async function sendMessage(input: {
  userId: string;
  to: string;
  subject?: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
}) {
  const { userId, to, subject, body, threadId, inReplyTo } = input;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.email) {
    throw createHttpError(400, "Cannot send email: User has no connected Gmail account.");
  }

  const now = new Date();
  const minuteBoundary = new Date(now.getTime() - 60 * 1000);
  const dayBoundary = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [minuteCount, dayCount] = await Promise.all([
    prisma.inboundEmail.count({ where: { userId, direction: "outbound", receivedAt: { gte: minuteBoundary } } }),
    prisma.inboundEmail.count({ where: { userId, direction: "outbound", receivedAt: { gte: dayBoundary } } })
  ]);

  if (minuteCount >= MAX_EMAILS_PER_MINUTE) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "message.rate_limit",
        entityType: "message",
        metadata: {
          window: "minute",
          limit: MAX_EMAILS_PER_MINUTE,
          attempts: minuteCount
        }
      }
    });
    throw createHttpError(429, "Rate limit exceeded (20 emails/minute).");
  }

  if (dayCount >= MAX_EMAILS_PER_DAY) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "message.rate_limit",
        entityType: "message",
        metadata: {
          window: "day",
          limit: MAX_EMAILS_PER_DAY,
          attempts: dayCount
        }
      }
    });
    throw createHttpError(429, "Rate limit exceeded (200 emails/day).");
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "message.send_attempt",
      entityType: "message",
      metadata: {
        to,
        subject,
        minuteCount,
        dayCount
      }
    }
  });

  // ---- 1. SEND USING GMAIL API SAFELY ----
  let sendResult;
  try {
    sendResult = await sendEmailWithGmail({
      userId,
      from: user.email,
      to,
      subject: subject ?? "",
      htmlBody: body,
      threadId,
      inReplyTo
    });
  } catch (err) {
    console.error("GMAIL API FAILED:", err);
    throw new Error("Failed to send email via Gmail.");
  }

  if (!sendResult || typeof sendResult.success !== "boolean") {
    console.error("GMAIL SEND ERROR:", sendResult);
    throw new Error("Invalid Gmail API response format.");
  }

  if (!sendResult.success) {
    console.error("GMAIL SEND ERROR:", sendResult);
    throw new Error(sendResult.error || "Gmail send failed.");
  }

  // Gmail must always return messageId + threadId
  const gmailMessageId = sendResult.messageId ?? undefined;
  const finalThreadId = sendResult.threadId ?? threadId ?? `local_${Date.now()}`;


  // ---- 2. SAVE IN DATABASE SAFELY ----
  try {
    const createdEmail = await prisma.$transaction(async (tx) => {
      const inbound = await tx.inboundEmail.create({
        data: {
          id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          fromEmail: user.email,
          toEmail: to,
          subject,
          body,
          gmailId: gmailMessageId,
          threadId: finalThreadId,
          direction: "outbound",
          isRead: true,
          receivedAt: new Date(),
          platform: "internal",
          createdAt: new Date(),
          updatedAt: new Date(),
          InboxMessage: {
            connectOrCreate: {
              where: { threadId: finalThreadId },
              create: {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                threadId: finalThreadId,
                userId,
                subject: subject ?? "",
                snippet: body.substring(0, 120),
                lastMessageAt: new Date(),
                participants: [user.email, to],
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any
            }
          }
        } as any
      });

      // emailOutbox model doesn't exist - outbound emails tracked via InboundEmail with direction="outbound"

      return inbound;
    });

    return formatMessage(createdEmail);

  } catch (err) {
    console.error("DB WRITE FAILED AFTER EMAIL SEND:", err);
    const message = err instanceof Error ? err.message : String(err);
    try {
      // systemEvent model doesn't exist - logging to AuditLog instead
      await prisma.auditLog.create({
        data: {
          userId,
          action: "email_send_failure",
          entityType: "email",
          metadata: { error: message }
        }
      });
    } catch (loggingError) {
      console.error("Failed to record audit log:", loggingError);
    }
    throw new Error("Email was sent but failed to store in database.");
  }
}
