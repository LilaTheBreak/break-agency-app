import prisma from "../../lib/prisma.js";
import { encode as base64Encode } from "js-base64";
import { google } from "googleapis";
import { getOAuthClientForUser } from "../gmail/tokens.js";

let BASE_URL = process.env.API_URL;

if (!BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('API_URL environment variable is required in production. App cannot start.');
}

BASE_URL = BASE_URL || "http://localhost:5001";

/**
 * Shape returned to messageService
 */
export interface GmailSendResult {
  success: boolean;
  messageId: string;
  threadId?: string;
}

export class GmailSendError extends Error {
  meta?: Record<string, unknown>;

  constructor(message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "GmailSendError";
    this.meta = meta;
  }
}

/**
 * Builds the raw MIME email body for Gmail API
 */
function buildRawEmail({
  from,
  to,
  subject,
  htmlBody,
  threadId,
  inReplyTo,
}: {
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  threadId?: string;
  inReplyTo?: string;
}) {
  const trackingPixelUrl = `${BASE_URL}/api/inbox/open-tracking/pixel`;

  const htmlWithTracking =
    htmlBody +
    `<img src="${trackingPixelUrl}?email=${encodeURIComponent(
      to
    )}" width="1" height="1" style="display:none;" />`;

  const messageParts = [
    `From: <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    threadId ? `References: ${threadId}` : ``,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : ``,
    ``,
    htmlWithTracking,
  ]
    .filter(Boolean)
    .join("\n");

  return base64Encode(messageParts)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Get OAuth2 client with refresh token
 */
async function getGmailOAuthClient(userId: string) {
  return getOAuthClientForUser(userId);
}

function shouldRetry(error: any) {
  const status = error?.response?.status;
  return [429, 500, 503].includes(status);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry<T>(operation: () => Promise<T>) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      await sleep(200 * attempt);
    }
  }
  throw new GmailSendError("Exceeded Gmail retry attempts");
}

/**
 * Send an email using Gmail API
 */
export async function sendEmailWithGmail({
  userId,
  from,
  to,
  subject,
  htmlBody,
  threadId,
  inReplyTo,
}: {
  userId: string;
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  threadId?: string;
  inReplyTo?: string;
}): Promise<GmailSendResult> {
  const auth = await getGmailOAuthClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildRawEmail({
    from,
    to,
    subject,
    htmlBody,
    threadId,
    inReplyTo,
  });

  try {
    const response = await sendWithRetry(() =>
      gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw,
          threadId,
        },
      })
    );

    const messageId = response.data?.id ?? response.data?.message?.id;
    const finalThreadId = threadId ?? response.data?.threadId;

    if (!messageId) {
      throw new GmailSendError("Gmail send response missing messageId", {
        userId,
        to,
        subject,
        threadId,
      });
    }

    return {
      success: true,
      messageId,
      threadId: finalThreadId,
    };
  } catch (error: any) {
    console.error("[GMAIL SEND ERROR]", {
      userId,
      subject,
      threadId,
      error: error?.response?.data || error?.message,
    });
    throw new GmailSendError("Failed to send Gmail message", {
      userId,
      subject,
      threadId,
      error: error?.response?.data?.error?.message || error?.message,
    });
  }
}
