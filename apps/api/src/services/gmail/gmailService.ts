import { google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { safeEnv } from "../../utils/safeEnv.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { refreshAccessToken } from "./oauthService.js";
import { SocialPlatform } from "@prisma/client";
import { updateDealThreadStage } from "../dealThreadService.js";
import { updateDealThreadAssociations } from "../dealThreadService.js";
import { detectBrand } from "../brandService.js";
import { triageQueue, dealExtractionQueue } from "../../worker/queues.js";
import { enqueueAIAgentTask } from "../aiAgent/aiAgentQueue.js";
import { enqueueNegotiationSession } from "../aiAgent/negotiationScheduler.js";

type ParsedMessage = {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  receivedAt: Date;
  from?: string;
  to?: string;
  bodyText?: string;
  bodyHtml?: string;
};

const clientId = safeEnv("GOOGLE_OAUTH_CLIENT_ID", "test-client");
const clientSecret = safeEnv("GOOGLE_OAUTH_CLIENT_SECRET", "test-secret");
const redirectUri = safeEnv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:5000/oauth/callback");

function createOAuthClient() {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getGmailClient(userId: string) {
  const token = await prisma.socialToken.findUnique({
    where: { userId_platform: { userId, platform: SocialPlatform.GMAIL } }
  });
  if (!token?.refreshToken) {
    throw new Error("Gmail not connected");
  }
  let accessToken = token.accessToken;
  let expiresAt = token.expiresAt ? new Date(token.expiresAt) : null;
  if (!accessToken || (expiresAt && expiresAt.getTime() < Date.now() + 60_000)) {
    const refreshed = await refreshAccessToken(token.refreshToken);
    accessToken = refreshed.accessToken;
    expiresAt = refreshed.expiresAt ?? null;
    await prisma.socialToken.update({
      where: { id: token.id },
      data: {
        accessToken,
        expiresAt
      }
    });
  }
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: token.refreshToken,
    expiry_date: expiresAt?.getTime()
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function listInboxMessages(userId: string) {
  const gmail = await getGmailClient(userId);
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 50,
    labelIds: ["INBOX"]
  });
  const messages = response.data.messages || [];
  const detailed = await Promise.all(
    messages.map(async (msg) => {
      if (!msg.id) return null;
      const full = await gmail.users.messages.get({ userId: "me", id: msg.id });
      return full.data;
    })
  );
  return detailed.filter(Boolean);
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
  const receivedAt = message.internalDate ? new Date(Number(message.internalDate)) : new Date();

  const parts = flattenParts(message.payload);
  const bodyText = parts.find((p) => p.mimeType === "text/plain")?.body;
  const bodyHtml = parts.find((p) => p.mimeType === "text/html")?.body;

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    snippet,
    receivedAt,
    from,
    to,
    bodyText,
    bodyHtml
  };
}

function isBrandReplyToOutreach(email: any) {
  if (!email) return false;
  if ((email as any).inReplyTo) return true;
  if (email.subject && /re:/i.test(email.subject)) return true;
  return Boolean(email.threadId);
}

function flattenParts(payload: any) {
  const results: Array<{ mimeType: string; body: string }> = [];
  const walk = (part: any) => {
    if (!part) return;
    if (part.mimeType && part.body) {
      const data = part.body.data ? Buffer.from(part.body.data, "base64").toString("utf8") : "";
      results.push({ mimeType: part.mimeType, body: data });
    }
    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(walk);
    }
  };
  walk(payload);
  return results;
}

export async function ingestGmailForUser(userId: string) {
  try {
    const messages = await listInboxMessages(userId);
    let processed = 0;
  for (const message of messages) {
    const parsed = parseMessage(message);
      const exists = await prisma.ingestedEmail.findFirst({
        where: {
          userId,
          subject: parsed.subject,
          receivedAt: parsed.receivedAt
        }
      });
      if (exists) continue;
      const record = await prisma.ingestedEmail.create({
        data: {
          userId,
          subject: parsed.subject,
          snippet: parsed.snippet,
          receivedAt: parsed.receivedAt,
          raw: parsed as any
        }
      });
      await updateDealThreadStage(userId, parsed);
      await updateDealThreadAssociations(userId, parsed);
      const inbound = await prisma.inboundEmail.create({
        data: {
          userId,
          subject: parsed.subject,
          snippet: parsed.snippet,
          body: parsed.bodyText || null,
          from: parsed.from || null,
          to: parsed.to || null,
          receivedAt: parsed.receivedAt,
          classification: null,
          extractedData: null
        }
      });
      await triageQueue.add("triage", { emailId: inbound.id });
      await dealExtractionQueue.add("extract", { emailId: inbound.id });
      const brand = await detectBrand(parsed);
      const root = (parsed.subject || "").trim().toLowerCase().replace(/^(re:|fw:|fwd:)\s*/i, "");
      const thread = await prisma.dealThread.findFirst({ where: { subjectRoot: root, brandEmail: parsed.raw?.from?.toLowerCase() || parsed.from?.toLowerCase() } });
      if (thread) {
        await prisma.dealEvent.create({
          data: {
            dealId: thread.id,
            type: "EMAIL",
            message: parsed.subject,
            metadata: parsed,
            actorId: userId
          }
        });
        if (!thread.brandId && brand?.id) {
          await prisma.dealThread.update({ where: { id: thread.id }, data: { brandId: brand.id } });
        }
      }
    await enqueueAIAgentTask({
      type: "INBOX_REPLY",
      userId,
      emailId: inbound.id,
      payload: { subject: parsed.subject, snippet: parsed.snippet }
    }).catch(() => null);

    if (isBrandReplyToOutreach(parsed)) {
      await enqueueNegotiationSession({ userId, emailData: parsed }).catch(() => null);
    }
    processed += 1;
  }
    return { processed };
  } catch (error) {
    await sendSlackAlert("Gmail ingest failed", { userId, error: `${error}` });
    throw error;
  }
}
