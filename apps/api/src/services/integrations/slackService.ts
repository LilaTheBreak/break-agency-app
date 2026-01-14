import prisma from '../../lib/prisma.js';
import { logError } from '../../lib/logger.js';

interface SlackNotification {
  text: string;
  blocks?: any[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

/**
 * Send Slack notification via webhook
 */
export async function sendSlackNotification(
  userId: string,
  notification: SlackNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's Slack connection
    const connection = await prisma.integrationConnection.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: "slack"
        }
      }
    });

    if (!connection || !connection.connected || !connection.webhookUrl) {
      return {
        success: false,
        error: "Slack not connected or webhook URL missing"
      };
    }

    // Send to Slack webhook
    const response = await fetch(connection.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: notification.text,
        blocks: notification.blocks,
        username: notification.username || "Break Agency",
        icon_emoji: notification.icon_emoji || ":rocket:",
        channel: notification.channel
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logError("Slack notification failed", new Error(errorText), { userId, webhookUrl: connection.webhookUrl });
      return {
        success: false,
        error: `Slack API error: ${response.status} ${errorText}`
      };
    }

    // Update last synced
    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() }
    });

    return { success: true };
  } catch (error) {
    logError("Slack notification error", error, { userId });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Send deal notification to Slack
 */
export async function notifyDealUpdate(
  userId: string,
  deal: { id: string; brandName?: string; stage: string; value?: number; currency?: string }
): Promise<void> {
  const enabled = process.env.SLACK_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return; // Gracefully degrade
  }

  const message = `*Deal Update*\n` +
    `Brand: ${deal.brandName || "Unknown"}\n` +
    `Stage: ${deal.stage}\n` +
    (deal.value ? `Value: ${deal.currency || "$"}${deal.value.toLocaleString()}\n` : "") +
    `View: ${process.env.FRONTEND_URL || "https://app.break.agency"}/admin/deals/${deal.id}`;

  await sendSlackNotification(userId, {
    text: message,
    icon_emoji: ":moneybag:"
  });
}

/**
 * Send invoice notification to Slack
 */
export async function notifyInvoiceCreated(
  userId: string,
  invoice: { id: string; dealId?: string; amount: number; currency?: string; status: string }
): Promise<void> {
  const enabled = process.env.SLACK_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return;
  }

  const message = `*Invoice Created*\n` +
    `Amount: ${invoice.currency || "$"}${invoice.amount.toLocaleString()}\n` +
    `Status: ${invoice.status}\n` +
    (invoice.dealId ? `Deal: ${invoice.dealId}\n` : "") +
    `View: ${process.env.FRONTEND_URL || "https://app.break.agency"}/admin/finance/invoices/${invoice.id}`;

  await sendSlackNotification(userId, {
    text: message,
    icon_emoji: ":receipt:"
  });
}

/**
 * Send approval notification to Slack
 */
export async function notifyApprovalRequired(
  userId: string,
  approval: { id: string; type: string; entityId: string; entityType: string }
): Promise<void> {
  const enabled = process.env.SLACK_INTEGRATION_ENABLED === "true";
  if (!enabled) {
    return;
  }

  const message = `*Approval Required*\n` +
    `Type: ${approval.type}\n` +
    `${approval.entityType}: ${approval.entityId}\n` +
    `View: ${process.env.FRONTEND_URL || "https://app.break.agency"}/admin/approvals/${approval.id}`;

  await sendSlackNotification(userId, {
    text: message,
    icon_emoji: ":white_check_mark:"
  });
}

