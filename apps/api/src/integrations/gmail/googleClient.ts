import { google } from "googleapis";
import { getOAuthClientForUser } from "../../services/gmail/tokens.js";

function decodeBase64Url(input?: string) {
  if (!input) return "";
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const buff = Buffer.from(normalized, "base64");
  return buff.toString("utf8");
}

export async function getGmailClient(userId: string) {
  const client = await getOAuthClientForUser(userId);
  return google.gmail({ version: "v1", auth: client });
}

export async function listUserMessages(userId: string) {
  const gmail = await getGmailClient(userId);
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 25,
    labelIds: ["INBOX"]
  });
  const messages = res.data.messages || [];
  const detailed = await Promise.all(
    messages.map(async (msg) => {
      if (!msg.id) return null;
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["Subject", "Date"]
      });
      const headers = full.data.payload?.headers || [];
      const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || null;
      const date = headers.find((h) => h.name?.toLowerCase() === "date")?.value || null;
      return {
        id: msg.id,
        snippet: full.data.snippet || "",
        subject,
        date
      };
    })
  );
  return detailed.filter(Boolean) as Array<{ id: string; snippet: string; subject: string | null; date: string | null }>;
}

// Alias for existing usage
export const listMessages = listUserMessages;
export const getUserMessages = listMessages;

export async function getUserMessage(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId);
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full"
  });
  const data = res.data;
  const headers = data.payload?.headers || [];
  const headerMap: Record<string, string> = {};
  headers.forEach((h) => {
    if (h.name && h.value) headerMap[h.name.toLowerCase()] = h.value;
  });

  const subject = headerMap["subject"] || null;
  const receivedAt = data.internalDate ? new Date(Number(data.internalDate)) : new Date();

  const collectBody = (part: any): string | null => {
    if (!part) return null;
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts && Array.isArray(part.parts)) {
      for (const child of part.parts) {
        const val = collectBody(child);
        if (val) return val;
      }
    }
    return null;
  };

  const body = collectBody(data.payload) || null;

  return {
    id: data.id || messageId,
    subject,
    snippet: data.snippet || "",
    receivedAt,
    headers: headerMap,
    body
  };
}
