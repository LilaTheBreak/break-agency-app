import prisma from "../../lib/prisma";
import { listAndFetchMessages } from "./fetchMessages";
import { mapGmailMessageToDb } from "./mappings";

interface SyncStats {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

/**
 * Synchronizes Gmail messages for a given user.
 * Fetches messages from the Gmail API, transforms them, and upserts them into the database.
 * @param userId - The ID of the user to sync messages for.
 * @returns A promise that resolves with synchronization statistics.
 */
export async function syncGmailForUser(userId: string): Promise<SyncStats> {
  const stats: SyncStats = { imported: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    // 1. Fetch raw messages from Gmail API
    const gmailMessages = await listAndFetchMessages(userId);

    if (!gmailMessages) {
      // This can happen if the user has no token or the token is invalid
      console.warn(`Skipping sync for user ${userId}: No valid Gmail client.`);
      return { ...stats, skipped: gmailMessages === null ? 1 : 0 }; // Assuming 1 user sync was skipped
    }

    // 2. Get existing emails to check for duplicates
    const existingEmails = await prisma.inboundEmail.findMany({
      where: {
        gmailId: { in: gmailMessages.map((m) => m.id!) }
      },
      select: { gmailId: true }
    });
    const existingGmailIds = new Set(existingEmails.map((e) => e.gmailId));

    for (const gmailMessage of gmailMessages) {
      if (!gmailMessage.id || !gmailMessage.threadId) {
        stats.failed++;
        continue;
      }

      // 3. Check for duplicates
      if (existingGmailIds.has(gmailMessage.id)) {
        stats.skipped++;
        continue;
      }

      // 4. Map Gmail message to our Prisma schema
      const { inboxMessageData, inboundEmailData } = mapGmailMessageToDb(gmailMessage, userId);

      // 5. Use a transaction to upsert the thread (InboxMessage) and create the email (InboundEmail)
      try {
        await prisma.$transaction(async (tx) => {
          const thread = await tx.inboxMessage.upsert({
            where: { threadId: inboxMessageData.threadId },
            update: inboxMessageData,
            create: { ...inboxMessageData, userId }
          });

          await tx.inboundEmail.create({
            data: { ...inboundEmailData, inboxMessageId: thread.id }
          });
        });
        stats.imported++;
      } catch (e) {
        console.error(`Failed to process message ${gmailMessage.id}:`, e);
        stats.failed++;
      }
    }
  } catch (error) {
    console.error(`Error during Gmail sync for user ${userId}:`, error);
    throw new Error("Gmail sync failed.");
  }

  console.log(`Sync complete for user ${userId}:`, stats);
  return stats;
}