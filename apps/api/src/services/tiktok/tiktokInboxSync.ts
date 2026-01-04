import axios from "axios";
import prisma from "../../lib/prisma.js";
import { getTikTokInboxToken } from "./tiktokInboxAuth.js";
import { generateId } from "../../lib/utils.js";

interface SyncStats {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

/**
 * Syncs TikTok messages/comments into InboundEmail and InboxMessage models
 * Note: TikTok API may have limitations on message access
 */
export async function syncTikTokInboxForUser(userId: string): Promise<SyncStats> {
  const stats: SyncStats = { imported: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const accessToken = await getTikTokInboxToken(userId);
    if (!accessToken) {
      console.warn(`[TIKTOK INBOX] No valid token for user ${userId}`);
      return { ...stats, skipped: 1 };
    }

    // TikTok API: Get messages
    // Note: TikTok API structure may vary - this is a placeholder implementation
    let messages;
    try {
      const messagesResponse = await axios.get(
        "https://open.tiktokapis.com/v2/message/list/",
        {
          params: {
            max_count: 50
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      messages = messagesResponse.data.data?.messages || [];
    } catch (error: any) {
      // TikTok API may not support messages for all account types
      if (error.response?.status === 400 || error.response?.status === 403) {
        console.warn(`[TIKTOK INBOX] Message access not available for user ${userId}: ${error.response?.data?.error?.message || "Insufficient permissions"}`);
        return { ...stats, skipped: 1 };
      }
      throw error;
    }

    if (!messages || messages.length === 0) {
      console.log(`[TIKTOK INBOX] No messages found for user ${userId}`);
      return stats;
    }

    // Get existing messages to check for duplicates
    const existingMessages = await prisma.inboundEmail.findMany({
      where: {
        tiktokId: { in: messages.map((m: any) => m.message_id || m.id) }
      },
      select: { tiktokId: true }
    });
    const existingIds = new Set(existingMessages.map((m) => m.tiktokId));

    // Process each message
    for (const message of messages) {
      const messageId = message.message_id || message.id;
      if (!messageId || existingIds.has(messageId)) {
        stats.skipped++;
        continue;
      }

      try {
        const messageDate = message.create_time 
          ? new Date(message.create_time * 1000) // TikTok uses Unix timestamp
          : new Date();

        // Extract participants (sender and receiver)
        const participants = [
          message.sender?.username || message.sender?.user_id,
          message.receiver?.username || message.receiver?.user_id
        ].filter(Boolean);

        // Use conversation ID as thread ID, or generate from participants
        const threadId = message.conversation_id 
          ? `tt_${message.conversation_id}`
          : `tt_${participants.sort().join("_")}`;

        // Upsert thread (InboxMessage)
        const thread = await prisma.inboxMessage.upsert({
          where: { threadId },
          update: {
            lastMessageAt: messageDate,
            snippet: message.text?.substring(0, 200) || "",
            participants,
            platform: "tiktok"
          },
          create: {
            id: generateId("inbox"),
            threadId,
            userId,
            platform: "tiktok",
            subject: `TikTok message from ${message.sender?.username || "Unknown"}`,
            snippet: message.text?.substring(0, 200) || "",
            lastMessageAt: messageDate,
            participants,
            receivedAt: messageDate,
            sender: message.sender?.username || message.sender?.user_id || null
          }
        });

        // Create InboundEmail
        await prisma.inboundEmail.create({
          data: {
            id: generateId("email"),
            userId,
            inboxMessageId: thread.id,
            platform: "tiktok",
            tiktokId: messageId,
            threadId,
            fromEmail: message.sender?.username || message.sender?.user_id || "unknown@tiktok.com",
            toEmail: message.receiver?.username || message.receiver?.user_id || "",
            subject: null,
            body: message.text || null,
            receivedAt: messageDate,
            direction: "inbound",
            isRead: false,
            categories: []
          }
        });

        stats.imported++;
      } catch (error) {
        console.error(`[TIKTOK INBOX] Failed to process message ${message.message_id || message.id}:`, error);
        stats.failed++;
      }
    }

    // Update last synced time
    await prisma.socialAccountConnection.updateMany({
      where: {
        creatorId: userId,
        platform: "tiktok",
        connected: true
      },
      data: {
        lastSyncedAt: new Date()
      }
    });

    console.log(`[TIKTOK INBOX] Sync complete for user ${userId}:`, stats);
    return stats;
  } catch (error) {
    console.error(`[TIKTOK INBOX] Error during sync for user ${userId}:`, error);
    throw new Error("TikTok inbox sync failed");
  }
}

