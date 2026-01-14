import { gmail_v1 as gmailV1 } from "googleapis";
import { Prisma } from "@prisma/client";
import { cleanEmailBody } from './gmailParser.js';

type InboundEmailCreateInput = Prisma.InboundEmailUncheckedCreateWithoutInboxMessageInput;
type InboxMessageUpdateInput = Prisma.InboxMessageUpdateInput;

/**
 * Parses the body of a Gmail message payload.
 * @param payload The message payload.
 * @returns An object with html and text content.
 */
function parseBody(payload: gmailV1.Schema$MessagePart | undefined) {
  let bodyHtml = "";
  let bodyText = "";

  if (payload?.mimeType === "text/html" && payload.body?.data) {
    bodyHtml = Buffer.from(payload.body.data, "base64").toString("utf-8");
  } else if (payload?.mimeType === "text/plain" && payload.body?.data) {
    bodyText = Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload?.parts) {
    for (const part of payload.parts) {
      const subPart = parseBody(part);
      bodyHtml += subPart.bodyHtml;
      bodyText += subPart.bodyText;
    }
  }

  return { bodyHtml, bodyText };
}

/**
 * Extracts a specific header value from a list of headers.
 * @param headers The list of headers.
 * @param name The name of the header to extract.
 * @returns The header value or an empty string.
 */
function getHeader(headers: gmailV1.Schema$MessagePartHeader[], name: string): string {
  const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

/**
 * Maps a raw Gmail API message object to the Prisma models for InboundEmail and InboxMessage.
 * @param message The raw message from the Gmail API.
 * @param userId The ID of the user who owns the message.
 * @returns An object containing data ready for Prisma create/update operations.
 */
export function mapGmailMessageToDb(
  message: gmailV1.Schema$Message,
  userId: string
): {
  inboxMessageData: InboxMessageUpdateInput;
  inboundEmailData: InboundEmailCreateInput;
} {
  // Safety checks
  if (!message.id) {
    throw new Error("Gmail message missing id");
  }
  if (!message.threadId) {
    throw new Error("Gmail message missing threadId");
  }
  
  const headers = message.payload?.headers || [];
  const { bodyHtml, bodyText } = parseBody(message.payload);

  const dateHeader = getHeader(headers, "Date");
  let messageDate: Date;
  try {
    messageDate = dateHeader ? new Date(dateHeader) : new Date();
    // Validate date
    if (Number.isNaN(messageDate.getTime())) {
      messageDate = new Date();
    }
  } catch (dateError) {
    console.warn(`[GMAIL MAPPING] Failed to parse date "${dateHeader}", using current date`);
    messageDate = new Date();
  }

  const fromHeader = getHeader(headers, "From");
  const toHeader = getHeader(headers, "To");
  const ccHeader = getHeader(headers, "Cc");
  
  // Data for the thread (InboxMessage)
  const inboxMessageData: InboxMessageUpdateInput = {
    threadId: message.threadId!,
    platform: "gmail", // Explicitly set platform
    subject: getHeader(headers, "Subject"),
    snippet: message.snippet || "",
    lastMessageAt: messageDate,
    sender: fromHeader, // Store sender email
    isRead: !(message.labelIds?.includes("UNREAD") ?? false),
    // Participants: combine From, To, and Cc headers
    participants: [
      fromHeader,
      ...(toHeader ? [toHeader] : []),
      ...(ccHeader ? [ccHeader] : [])
    ].filter(Boolean)
  };

  // Data for the individual email (InboundEmail)
  // Combine bodyHtml and bodyText into single body field (prefer text, fallback to HTML)
  const body = bodyText || (bodyHtml ? cleanEmailBody(bodyHtml) : "");
  
  // Ensure required fields are present
  const fromEmail = getHeader(headers, "From") || "";
  const toEmail = getHeader(headers, "To") || "";
  
  if (!fromEmail) {
    console.warn(`[GMAIL MAPPING] Message ${message.id} missing From header, using fallback`);
  }
  
  const inboundEmailData: InboundEmailCreateInput = {
    id: `inbound_${message.id!}`,
    userId: userId || undefined, // Set foreign key directly, not via nested relation
    platform: "gmail", // Explicitly set platform
    gmailId: message.id!,
    threadId: message.threadId || undefined, // Store thread ID for relationship queries
    subject: getHeader(headers, "Subject") || null,
    fromEmail: fromEmail || "unknown@unknown.com", // Fallback for required field
    toEmail: toEmail || "", // Can be empty string
    receivedAt: messageDate,
    body: body || null,
    snippet: message.snippet || null, // Store snippet for quick preview without loading full body
    isRead: !(message.labelIds?.includes("UNREAD") ?? false),
    categories: [],
    // Store Gmail-specific metadata (labels, raw message ID, etc.)
    metadata: {
      gmailLabels: message.labelIds || [],
      gmailThreadId: message.threadId,
      importedAt: new Date().toISOString(),
    } as any,
    // Note: Other fields (aiCategory, aiUrgency, etc.) are set by separate AI classification job
  };

  return { inboxMessageData, inboundEmailData };
}