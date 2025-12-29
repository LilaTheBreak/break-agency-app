import { gmail_v1 as gmailV1, google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { getOAuthClientForUser } from "./tokens.js";
import { mapGmailMessageToDb } from "./mappings.js";
import { linkEmailToCrm } from "./linkEmailToCrm.js";
// import { logAuditEvent } from "../../lib/auditLogger.js"; // No req context in service

interface SyncStats {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  contactsCreated: number;
  brandsCreated: number;
  linkErrors: number;
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
  const stats: SyncStats = { 
    imported: 0, 
    updated: 0, 
    skipped: 0, 
    failed: 0,
    contactsCreated: 0,
    brandsCreated: 0,
    linkErrors: 0,
  };

  // Audit log: Gmail sync started
  // await logAction({
  //   userId,
  //   action: "GMAIL_SYNC_STARTED",
  //   entityType: "GMAIL_SYNC",
  //   entityId: userId,
  //   metadata: { timestamp: new Date().toISOString() },
  // });

  let gmail: gmailV1.Gmail;
  try {
    const oauthClient = await getOAuthClientForUser(userId);
    gmail = google.gmail({ version: "v1", auth: oauthClient });
  } catch (error) {
    console.warn(`Skipping sync for user ${userId}: No valid Gmail client.`, error);
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

      let createdEmail: any = null;
      await prisma.$transaction(async (tx) => {
        const thread = await tx.inboxMessage.upsert({
          where: { threadId: inboxMessageData.threadId },
          update: inboxMessageData,
          create: { ...inboxMessageData, userId }
        });
        
        // Use upsert to handle race conditions (concurrent syncs)
        createdEmail = await tx.inboundEmail.upsert({
          where: { gmailId: gmailMessage.id! },
          update: {
            subject: inboundEmailData.subject,
            snippet: inboundEmailData.snippet,
            body: inboundEmailData.body,
            inboxMessageId: thread.id,
          },
          create: { ...inboundEmailData, inboxMessageId: thread.id },
        });
      });

      stats.imported++;

      // Link email to CRM (contact + brand) and classify
      if (createdEmail) {
        try {
          // 1. Link to CRM (creates contacts/brands)
          const linkResult = await linkEmailToCrm({
            id: createdEmail.id,
            fromEmail: createdEmail.fromEmail,
            userId,
          });

          if (linkResult.error) {
            console.warn(`[GMAIL SYNC] CRM link failed for email ${createdEmail.id}:`, linkResult.error);
            stats.linkErrors++;
          } else {
            if (linkResult.contactCreated) stats.contactsCreated++;
            if (linkResult.brandCreated) stats.brandsCreated++;
          }

          // 2. Classify email (rule-based, fast)
          try {
            const { classifyWithRules } = await import("./gmailCategoryEngine.js");
            const classification = classifyWithRules(
              createdEmail.body || "",
              createdEmail.subject || "",
              createdEmail.fromEmail
            );
            
            // Update email with classification
            await prisma.inboundEmail.update({
              where: { id: createdEmail.id },
              data: {
                categories: [classification.category],
                // Store classification in metadata for now (aiCategory requires AI analysis)
                metadata: {
                  ...(createdEmail.metadata as object || {}),
                  ruleCategory: classification.category,
                  ruleUrgency: classification.urgency,
                  classifiedAt: new Date().toISOString(),
                }
              }
            });
          } catch (classifyError) {
            // Don't fail sync on classification errors
            console.warn(`[GMAIL SYNC] Classification failed for email ${createdEmail.id}:`, classifyError);
          }
        } catch (linkError) {
          console.error(`[GMAIL SYNC] CRM link error for email ${createdEmail.id}:`, linkError);
          stats.linkErrors++;
        }
      }
    }

    // Update last synced timestamp and clear errors
    await prisma.gmailToken.update({
      where: { userId },
      data: { 
        lastSyncedAt: new Date(),
        lastError: null,
        lastErrorAt: null,
      },
    });

    // Audit log: Gmail sync completed
    // await logAction({
    //   userId,
    //   action: "GMAIL_SYNC_COMPLETED",
    //   entityType: "GMAIL_SYNC",
    //   entityId: userId,
    //   metadata: { 
    //     stats,
    //     timestamp: new Date().toISOString(),
    //   },
    // });
  } catch (error) {
    console.error(`Error during Gmail sync for user ${userId}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Update GmailToken with error
    try {
      await prisma.gmailToken.update({
        where: { userId },
        data: { 
          lastError: errorMessage,
          lastErrorAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error(`Failed to update GmailToken lastError for user ${userId}:`, updateError);
    }
    
    // Audit log: Gmail sync failed
    // await logAction({
    //   userId,
    //   action: "GMAIL_SYNC_FAILED",
    //   entityType: "GMAIL_SYNC",
    //   entityId: userId,
    //   metadata: { 
    //     error: errorMessage,
    //     stats,
    //   },
    // });
    
    throw new Error("Gmail sync failed.");
  }

  console.log(`Sync complete for user ${userId}:`, stats);
  return stats;
}
