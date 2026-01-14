import axios from "axios";
import prisma from '../../lib/prisma.js';
import { getInstagramInboxToken } from './instagramInboxAuth.js';
import { generateId } from '../../lib/utils.js';

interface SyncStats {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

/**
 * Syncs Instagram DMs into InboundEmail and InboxMessage models
 * Note: Instagram Graph API requires Business or Creator account for DM access
 */
export async function syncInstagramInboxForUser(userId: string): Promise<SyncStats> {
  const stats: SyncStats = { imported: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const accessToken = await getInstagramInboxToken(userId);
    if (!accessToken) {
      console.warn(`[INSTAGRAM INBOX] No valid token for user ${userId}`);
      return { ...stats, skipped: 1 };
    }

    // Instagram Graph API: Get conversations (DMs)
    // Note: This requires Instagram Business/Creator account and proper permissions
    let conversations;
    try {
      const conversationsResponse = await axios.get(
        "https://graph.instagram.com/me/conversations",
        {
          params: {
            fields: "id,participants,updated_time",
            access_token: accessToken
          }
        }
      );
      conversations = conversationsResponse.data.data || [];
    } catch (error: any) {
      // Instagram API may not support DMs for all account types
      if (error.response?.status === 400 || error.response?.status === 403) {
        console.warn(`[INSTAGRAM INBOX] DM access not available for user ${userId}: ${error.response?.data?.error?.message || "Insufficient permissions"}`);
        return { ...stats, skipped: 1 };
      }
      throw error;
    }

    if (!conversations || conversations.length === 0) {
      console.log(`[INSTAGRAM INBOX] No conversations found for user ${userId}`);
      return stats;
    }

    // Fetch messages for each conversation
    for (const conversation of conversations.slice(0, 50)) { // Limit to 50 conversations
      try {
        const messagesResponse = await axios.get(
          `https://graph.instagram.com/${conversation.id}/messages`,
          {
            params: {
              fields: "id,from,to,message,created_time",
              access_token: accessToken
            }
          }
        );

        const messages = messagesResponse.data.data || [];
        const threadId = `ig_${conversation.id}`;

        // Get existing messages to check for duplicates
        const existingMessages = await prisma.inboundEmail.findMany({
          where: {
            instagramId: { in: messages.map((m: any) => m.id) }
          },
          select: { instagramId: true }
        });
        const existingIds = new Set(existingMessages.map((m) => m.instagramId));

        // Process each message
        for (const message of messages) {
          if (!message.id || existingIds.has(message.id)) {
            stats.skipped++;
            continue;
          }

          try {
            const messageDate = message.created_time 
              ? new Date(message.created_time) 
              : new Date();

            // Extract participants
            const participants = [
              message.from?.username || message.from?.id,
              message.to?.username || message.to?.id
            ].filter(Boolean);

            // Upsert thread (InboxMessage)
            const thread = await prisma.inboxMessage.upsert({
              where: { threadId },
              update: {
                lastMessageAt: messageDate,
                snippet: message.message?.substring(0, 200) || "",
                participants,
                platform: "instagram"
              },
              create: {
                id: generateId("inbox"),
                threadId,
                userId,
                platform: "instagram",
                subject: `Instagram DM from ${message.from?.username || "Unknown"}`,
                snippet: message.message?.substring(0, 200) || "",
                lastMessageAt: messageDate,
                participants,
                receivedAt: messageDate,
                sender: message.from?.username || message.from?.id || null
              }
            });

            // Create InboundEmail
            await prisma.inboundEmail.create({
              data: {
                id: generateId("email"),
                userId,
                inboxMessageId: thread.id,
                platform: "instagram",
                instagramId: message.id,
                threadId,
                fromEmail: message.from?.username || message.from?.id || "unknown@instagram.com",
                toEmail: message.to?.username || message.to?.id || "",
                subject: null,
                body: message.message || null,
                receivedAt: messageDate,
                direction: "inbound",
                isRead: false,
                categories: []
              }
            });

            stats.imported++;
          } catch (error) {
            console.error(`[INSTAGRAM INBOX] Failed to process message ${message.id}:`, error);
            stats.failed++;
          }
        }
      } catch (error: any) {
        console.error(`[INSTAGRAM INBOX] Failed to fetch messages for conversation ${conversation.id}:`, error);
        stats.failed++;
      }
    }

    // Update last synced time
    await prisma.socialAccountConnection.updateMany({
      where: {
        creatorId: userId,
        platform: "instagram",
        connected: true
      },
      data: {
        lastSyncedAt: new Date()
      }
    });

    console.log(`[INSTAGRAM INBOX] Sync complete for user ${userId}:`, stats);
    return stats;
  } catch (error) {
    console.error(`[INSTAGRAM INBOX] Error during sync for user ${userId}:`, error);
    throw new Error("Instagram inbox sync failed");
  }
}

