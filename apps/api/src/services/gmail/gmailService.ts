import { google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { getOAuthClientForUser } from "./tokens.js";
import { linkEmailToCrm } from "./linkEmailToCrm.js";

function flattenParts(payload: any) {
  const results: Array<{ mimeType: string; body: string; attachmentId?: string; filename?: string }> = [];
  const walk = (part: any) => {
    if (!part) return;
    if (part.mimeType) {
      const data = part.body?.data ? Buffer.from(part.body.data, "base64").toString("utf8") : "";
      results.push({
        mimeType: part.mimeType,
        body: data,
        attachmentId: part.body?.attachmentId,
        filename: part.filename,
      });
    }
    if (Array.isArray(part.parts)) {
      part.parts.forEach(walk);
    }
  };
  walk(payload);
  return results;
}

function extractBody(payload: any) {
  const parts = flattenParts(payload);
  const html = parts.find((p) => p.mimeType === "text/html")?.body;
  const text = parts.find((p) => p.mimeType === "text/plain")?.body;
  const hasAttachments = parts.some((p) => p.attachmentId || p.filename);
  return { htmlBody: html || undefined, textBody: text || undefined, hasAttachments };
}

function parseAddressList(header: string | undefined) {
  if (!header) return [];
  return header
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

type ParsedMessage = {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  receivedAt: Date;
  from?: string;
  to?: string;
  recipients: string[];
  bodyHtml?: string;
  bodyText?: string;
  hasAttachments: boolean;
  gmailLabels: string[];
};

export async function getGmailClient(userId: string) {
  const client = await getOAuthClientForUser(userId);
  return google.gmail({ version: "v1", auth: client });
}

export async function listInboxMessages(userId: string) {
  const gmail = await getGmailClient(userId);
  const messages: Array<any> = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100,
      labelIds: ["INBOX"],
      pageToken: nextPageToken,
    });
    messages.push(...(response.data.messages ?? []));
    nextPageToken = response.data.nextPageToken || undefined;
  } while (nextPageToken);

  const detailed = [];
  for (const msg of messages) {
    try {
      if (!msg.id) continue;
      const full = await gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" });
      detailed.push(full.data);
    } catch (error) {
      console.warn("Failed to fetch Gmail message", { userId, error });
    }
  }
  return detailed;
}

export async function syncInbox(userId: string) {
  return listInboxMessages(userId);
}

export async function getMessageDetail(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId);
  const full = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
  return full.data;
}

export function parseMessage(message: any): ParsedMessage {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
  const snippet = message.snippet || "";
  const subject = getHeader("subject") || "No subject";
  const from = getHeader("from");
  const to = getHeader("to");
  const cc = getHeader("cc");
  const receivedAt = message.internalDate ? new Date(Number(message.internalDate)) : new Date();
  const gmailId = message.id ?? message?.message?.id;
  const threads = message.threadId ?? message?.thread?.id;

  const body = extractBody(message.payload);

  return {
    id: gmailId,
    threadId: threads,
    subject,
    snippet,
    receivedAt,
    from,
    to,
    recipients: [...parseAddressList(to), ...parseAddressList(cc)],
    bodyText: body.textBody,
    bodyHtml: body.htmlBody,
    hasAttachments: body.hasAttachments,
    gmailLabels: message.labelIds ?? [],
  };
}

export async function ingestGmailForUser(userId: string) {
  try {
    const messages = await listInboxMessages(userId);
    let processed = 0;

    for (const message of messages) {
      try {
        if (!message?.id) {
          console.warn("Skipping Gmail message without id", { userId });
          continue;
        }
        const parsed = parseMessage(message);
        if (!parsed.id) {
          console.warn("Parsed Gmail message missing id, skipping", { userId });
          continue;
        }
        if (!parsed.threadId) {
          console.warn("Parsed Gmail message missing threadId, skipping", { userId, messageId: parsed.id });
          continue;
        }

        await prisma.inboxMessage.upsert({
          where: { threadId: parsed.threadId },
          update: {
            lastMessageAt: parsed.receivedAt,
            snippet: parsed.snippet,
            subject: parsed.subject,
          },
          create: {
            id: parsed.id,
            userId,
            threadId: parsed.threadId,
            subject: parsed.subject,
            snippet: parsed.snippet,
            isRead: false,
            lastMessageAt: parsed.receivedAt,
            participants: [],
          },
        });

        await prisma.inboxThreadMeta.upsert({
          where: { threadId: parsed.threadId },
          update: {
            lastMessageAt: parsed.receivedAt,
            lastMessageSnippet: parsed.snippet,
            subject: parsed.subject,
          },
          create: {
            threadId: parsed.threadId,
            userId,
            aiThreadSummary: null,
            unreadCount: 0,
            priority: 0,
            lastMessageAt: parsed.receivedAt,
            lastMessageSnippet: parsed.snippet,
            subject: parsed.subject,
          },
        });

        const summaryText = (parsed.bodyText || parsed.bodyHtml || "").slice(0, 120);
        const metadata = {
          source: "gmail",
          parsedFromAddress: parsed.from ?? "",
          parsedRecipientList: parsed.recipients,
          parsedThreadInfo: {
            threadId: parsed.threadId,
            subject: parsed.subject,
          },
          threadId: parsed.threadId,
          messageId: parsed.id,
          hasHtmlBody: Boolean(parsed.bodyHtml),
          hasAttachments: parsed.hasAttachments,
          gmailLabels: parsed.gmailLabels,
          extractedSummary: summaryText,
        };

        // Use upsert to handle race conditions (concurrent syncs)
        const inbound = await prisma.inboundEmail.upsert({
          where: { gmailId: parsed.id },
          update: {
            subject: parsed.subject,
            snippet: parsed.snippet,
            body: parsed.bodyText ?? parsed.bodyHtml ?? null,
            metadata,
          },
          create: {
            userId,
            threadId: parsed.threadId,
            gmailId: parsed.id,
            subject: parsed.subject,
            snippet: parsed.snippet,
            body: parsed.bodyText ?? parsed.bodyHtml ?? null,
            fromEmail: parsed.from ?? "",
            toEmail: parsed.to ?? "",
            receivedAt: parsed.receivedAt,
            categories: [],
            metadata,
          },
        });

        // Link email to CRM (Contact + Brand)
        try {
          const linkResult = await linkEmailToCrm({
            id: inbound.id,
            fromEmail: inbound.fromEmail,
            userId,
          });

          if (linkResult.error) {
            console.warn(`[GMAIL INGEST] CRM link failed for email ${inbound.id}:`, linkResult.error);
          }
        } catch (linkError) {
          console.error(`[GMAIL INGEST] CRM link error for email ${inbound.id}:`, linkError);
          // Don't fail the entire ingest on CRM link errors
        }

        processed += 1;
      } catch (error) {
        console.error("Gmail ingest error for message", { userId, error });
      }
    }

    return { processed };
  } catch (error) {
    await sendSlackAlert("Gmail ingest failed", { userId, error: `${error}` });
    throw error;
  }
}
