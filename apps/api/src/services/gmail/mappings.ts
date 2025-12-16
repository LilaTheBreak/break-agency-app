import { gmail_v1 as gmailV1 } from "googleapis";
import { Prisma } from "@prisma/client";

type InboundEmailCreateInput = Prisma.InboundEmailCreateWithoutInboxMessageInput;
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
  const headers = message.payload?.headers || [];
  const { bodyHtml, bodyText } = parseBody(message.payload);

  const dateHeader = getHeader(headers, "Date");
  const messageDate = dateHeader ? new Date(dateHeader) : new Date();

  // Data for the thread (InboxMessage)
  const inboxMessageData: InboxMessageUpdateInput = {
    threadId: message.threadId!,
    subject: getHeader(headers, "Subject"),
    snippet: message.snippet || "",
    lastMessageAt: messageDate,
    isRead: !(message.labelIds?.includes("UNREAD") ?? false),
    // Participants can be derived from 'From', 'To', 'Cc' headers across the thread
    // For simplicity, we'll just use the 'From' of the latest message for now.
    participants: [getHeader(headers, "From")]
  };

  // Data for the individual email (InboundEmail)
  const inboundEmailData: InboundEmailCreateInput = {
    gmailId: message.id!,
    threadId: message.threadId!,
    subject: getHeader(headers, "Subject"),
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    date: messageDate,
    bodyHtml,
    bodyText,
    isRead: !(message.labelIds?.includes("UNREAD") ?? false),
    labels: message.labelIds || [],
    // Attachment handling stub
    attachments:
      message.payload?.parts
        ?.filter((part) => part.filename && part.body?.attachmentId)
        .map((part) => ({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body?.size,
          attachmentId: part.body?.attachmentId
        })) || []
  };

  return { inboxMessageData, inboundEmailData };
}