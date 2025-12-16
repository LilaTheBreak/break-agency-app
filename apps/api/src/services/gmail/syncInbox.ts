import { gmail_v1 as gmailV1 } from "googleapis";
import prisma from "../../lib/prisma";
import { getOAuthClientForUser } from "./tokens.js";
import { mapGmailMessageToDb } from "./mappings";

interface SyncStats {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

/**
 * Fetches the last 100 message details from the Gmail API for a user.
 * @param gmail - The authenticated Gmail API client.
 * @returns A promise that resolves to an array of full Gmail message objects.
 */
async function fetchRecentMessages(gmail: gmailV1.Gmail): Promise<gmailV1.Schema$Message[]> {
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100, // Fetch more messages to ensure comprehensive sync
    q: "in:inbox"
  });

  const messages = listResponse.data.messages;
  if (!messages || messages.length === 0) {
    return [];
  }

  // Note: For production scale, a proper batching endpoint is recommended.
  // This implementation uses Promise.all for simplicity with 100 messages.
  const messagePromises = messages
    .filter((msg) => msg.id)
    .map((msg) =>
      gmail.users.messages
        .get({ userId: "me", id: msg.id!, format: "full" })
        .then((res) => res.data)
    );

  const fullMessages = await Promise.all(messagePromises);
  return fullMessages.filter((msg): msg is gmailV1.Schema$Message => !!msg);
}

/**
 * Synchronizes Gmail messages for a given user.
 * Fetches messages, transforms them, and transactionally upserts them into the database.
 * @param userId - The ID of the user to sync.
 * @returns A promise that resolves with synchronization statistics.
 */
export async function syncInboxForUser(userId: string): Promise<SyncStats> {
  const stats: SyncStats = { imported: 0, updated: 0, skipped: 0, failed: 0 };

  const gmail = await getOAuthClientForUser(userId);
  if (!gmail) {
    console.warn(`Skipping sync for user ${userId}: No valid Gmail client.`);
    stats.failed = 1; // Mark the whole sync as failed
    return stats;
  }

  try {
    const gmailMessages = await fetchRecentMessages(gmail);

    const existingGmailIds = new Set(
      (
        await prisma.inboundEmail.findMany({
          where: { gmailId: { in: gmailMessages.map((m) => m.id!) } },
          select: { gmailId: true }
        })
      ).map((e) => e.gmailId)
    );

    for (const gmailMessage of gmailMessages) {
      if (!gmailMessage.id || !gmailMessage.threadId) {
        stats.failed++;
        continue;
      }

      if (existingGmailIds.has(gmailMessage.id)) {
        stats.skipped++;
        continue;
      }

      const { inboxMessageData, inboundEmailData } = mapGmailMessageToDb(gmailMessage, userId);

      await prisma.$transaction(async (tx) => {
        const thread = await tx.inboxMessage.upsert({
          where: { threadId: inboxMessageData.threadId },
          update: inboxMessageData,
          create: { ...inboxMessageData, userId }
        });
        await tx.inboundEmail.create({ data: { ...inboundEmailData, inboxMessageId: thread.id } });
      });

      stats.imported++;
    }
  } catch (error) {
    console.error(`Error during Gmail sync for user ${userId}:`, error);
    throw new Error("Gmail sync failed.");
  }

  console.log(`Sync complete for user ${userId}:`, stats);
  return stats;
}
