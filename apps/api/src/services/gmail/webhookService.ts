import { google } from "googleapis";
import prisma from '../../lib/prisma';
import { getOAuthClientForUser } from './tokens';
import crypto from "crypto";

const WEBHOOK_TOPIC = "projects/YOUR_GCP_PROJECT_ID/topics/gmail-notifications";
const WEBHOOK_ENDPOINT = process.env.GMAIL_WEBHOOK_URL || `${process.env.BACKEND_URL}/api/gmail/webhook/notification`;

interface WatchResponse {
  historyId: string;
  expiration: string;
}

/**
 * Register Gmail push notifications for a user
 * Gmail will send webhook notifications when new messages arrive
 */
export async function registerWebhook(userId: string): Promise<WatchResponse> {
  const client = await getOAuthClientForUser(userId);
  const gmail = google.gmail({ version: "v1", auth: client });

  // Request push notifications
  const response = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: WEBHOOK_TOPIC,
      labelIds: ["INBOX"]
    }
  });

  const historyId = response.data.historyId || "";
  const expiration = response.data.expiration || "";

  // Store webhook info in database
  await prisma.gmailToken.update({
    where: { userId },
    data: {
      webhookHistoryId: historyId,
      webhookExpiration: expiration ? new Date(parseInt(expiration)) : null
    }
  });

  console.log(`[GMAIL WEBHOOK] Registered for user ${userId}, expires: ${new Date(parseInt(expiration)).toISOString()}`);

  return {
    historyId,
    expiration
  };
}

/**
 * Stop Gmail push notifications for a user
 */
export async function stopWebhook(userId: string): Promise<void> {
  const client = await getOAuthClientForUser(userId);
  const gmail = google.gmail({ version: "v1", auth: client });

  await gmail.users.stop({ userId: "me" });

  // Clear webhook info from database
  await prisma.gmailToken.update({
    where: { userId },
    data: {
      webhookHistoryId: null,
      webhookExpiration: null
    }
  });

  console.log(`[GMAIL WEBHOOK] Stopped for user ${userId}`);
}

/**
 * Renew webhook for a user (should be called before expiration)
 * Gmail webhooks expire after 7 days
 */
export async function renewWebhook(userId: string): Promise<WatchResponse> {
  console.log(`[GMAIL WEBHOOK] Renewing webhook for user ${userId}...`);
  
  // Stop existing webhook
  try {
    await stopWebhook(userId);
  } catch (error) {
    console.warn(`[GMAIL WEBHOOK] Failed to stop existing webhook for user ${userId}:`, error);
  }

  // Register new webhook
  return registerWebhook(userId);
}

/**
 * Renew all expiring webhooks
 * Should be called daily by cron job
 */
export async function renewExpiringWebhooks(): Promise<void> {
  const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const expiringTokens = await prisma.gmailToken.findMany({
    where: {
      webhookExpiration: {
        lte: expirationThreshold,
        not: null
      }
    },
    select: { userId: true, webhookExpiration: true }
  });

  console.log(`[GMAIL WEBHOOK] Found ${expiringTokens.length} webhooks expiring within 24 hours`);

  for (const token of expiringTokens) {
    try {
      await renewWebhook(token.userId);
      console.log(`[GMAIL WEBHOOK] ✓ Renewed webhook for user ${token.userId}`);
    } catch (error) {
      console.error(`[GMAIL WEBHOOK] ✗ Failed to renew webhook for user ${token.userId}:`, error);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Verify webhook notification is from Google
 */
export function verifyWebhookSignature(message: string, signature: string, token: string): boolean {
  const hmac = crypto.createHmac("sha256", token);
  hmac.update(message);
  const expectedSignature = hmac.digest("base64");
  
  return signature === expectedSignature;
}

/**
 * Process incoming webhook notification from Gmail
 */
export async function processWebhookNotification(data: any): Promise<{ userId: string | null; historyId: string }> {
  // Decode the push notification
  const message = data.message;
  if (!message || !message.data) {
    throw new Error("Invalid webhook notification format");
  }

  // Decode base64 data
  const decodedData = JSON.parse(Buffer.from(message.data, "base64").toString("utf-8"));
  const emailAddress = decodedData.emailAddress;
  const historyId = decodedData.historyId;

  console.log(`[GMAIL WEBHOOK] Received notification for ${emailAddress}, historyId: ${historyId}`);

  // Find user by email address
  const user = await prisma.user.findFirst({
    where: { email: emailAddress }
  });

  if (!user) {
    console.warn(`[GMAIL WEBHOOK] No user found for email ${emailAddress}`);
    return { userId: null, historyId };
  }

  // Check if historyId is newer than what we have
  const token = await prisma.gmailToken.findUnique({
    where: { userId: user.id },
    select: { webhookHistoryId: true }
  });

  if (token?.webhookHistoryId && parseInt(historyId) <= parseInt(token.webhookHistoryId)) {
    console.log(`[GMAIL WEBHOOK] HistoryId ${historyId} already processed for user ${user.id}`);
    return { userId: user.id, historyId };
  }

  console.log(`[GMAIL WEBHOOK] New historyId ${historyId} for user ${user.id}, triggering sync...`);

  return { userId: user.id, historyId };
}
