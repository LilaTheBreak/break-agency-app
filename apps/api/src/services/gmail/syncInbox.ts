import { gmail_v1 as gmailV1, google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { getOAuthClientForUser, GmailNotConnectedError } from "./tokens.js";
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
  let listResponse;
  try {
    listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 100, // Fetch more messages to ensure comprehensive sync
      q: "in:inbox"
    });
  } catch (listError: any) {
    console.error(`[GMAIL SYNC] Failed to list messages:`, {
      error: listError instanceof Error ? listError.message : String(listError),
      code: listError?.code,
      status: listError?.response?.status,
      statusText: listError?.response?.statusText,
    });
    throw listError; // Re-throw to be handled by caller
  }

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
        .catch((getError) => {
          // Log individual message fetch failures but don't fail entire sync
          console.warn(`[GMAIL SYNC] Failed to fetch message ${msg.id}:`, {
            error: getError instanceof Error ? getError.message : String(getError),
            messageId: msg.id,
          });
          return null; // Return null for failed fetches
        })
    );

  const fullMessages = await Promise.all(messagePromises);
  const validMessages = fullMessages.filter((msg): msg is gmailV1.Schema$Message => !!msg);
  
  if (validMessages.length < fullMessages.length) {
    console.warn(`[GMAIL SYNC] Some messages failed to fetch: ${fullMessages.length - validMessages.length} failed out of ${fullMessages.length}`);
  }
  
  return validMessages;
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
    // Handle GmailNotConnectedError specifically - don't swallow it
    if (error instanceof GmailNotConnectedError) {
      console.warn(`[GMAIL SYNC] Gmail not connected for user ${userId}`);
      throw error; // Re-throw so controller can handle it properly
    }
    
    // Log other OAuth errors with full details
    console.error(`[GMAIL SYNC] Failed to get OAuth client for user ${userId}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Update GmailToken with error
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await prisma.gmailToken.update({
        where: { userId },
        data: { 
          lastError: errorMessage.slice(0, 500),
          lastErrorAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error(`[GMAIL SYNC] Failed to update GmailToken error for user ${userId}:`, updateError);
    }
    
    throw error; // Re-throw original error with full details
  }

  try {
    let gmailMessages: gmailV1.Schema$Message[];
    try {
      gmailMessages = await fetchRecentMessages(gmail);
    } catch (fetchError: any) {
      // Handle Google API errors specifically
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      const errorCode = fetchError?.code || fetchError?.response?.status;
      
      console.error(`[GMAIL SYNC] Failed to fetch messages from Gmail API for user ${userId}:`, {
        error: errorMessage,
        code: errorCode,
        status: fetchError?.response?.status,
        statusText: fetchError?.response?.statusText,
      });
      
      // Update GmailToken with error
      try {
        await prisma.gmailToken.update({
          where: { userId },
          data: { 
            lastError: `Gmail API error: ${errorMessage}`.slice(0, 500),
            lastErrorAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error(`[GMAIL SYNC] Failed to update GmailToken error for user ${userId}:`, updateError);
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }

    // Get existing email IDs to check for duplicates
    // Handle empty array case to avoid Prisma errors
    const existingGmailIds = new Set<string>();
    if (gmailMessages.length > 0) {
      const gmailIds = gmailMessages.map((m) => m.id!).filter(Boolean);
      if (gmailIds.length > 0) {
        try {
          const existingEmails = await prisma.inboundEmail.findMany({
            where: { gmailId: { in: gmailIds } },
            select: { gmailId: true }
          });
          existingEmails.forEach((e) => {
            if (e.gmailId) existingGmailIds.add(e.gmailId);
          });
        } catch (dbError) {
          console.error(`[GMAIL SYNC] Failed to check existing emails for user ${userId}:`, {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            gmailIdsCount: gmailIds.length,
          });
          // Continue with sync even if we can't check duplicates
        }
      }
    }

    for (const gmailMessage of gmailMessages) {
      if (!gmailMessage.id || !gmailMessage.threadId) {
        stats.failed++;
        continue;
      }

      if (existingGmailIds.has(gmailMessage.id)) {
        stats.skipped++;
        continue;
      }

      let inboxMessageData, inboundEmailData;
      try {
        const mapped = mapGmailMessageToDb(gmailMessage, userId);
        inboxMessageData = mapped.inboxMessageData;
        inboundEmailData = mapped.inboundEmailData;
      } catch (mapError) {
        console.error(`[GMAIL SYNC] Failed to map message ${gmailMessage.id} for user ${userId}:`, {
          error: mapError instanceof Error ? mapError.message : String(mapError),
          messageId: gmailMessage.id,
        });
        stats.failed++;
        continue;
      }

      let createdEmail: any = null;
      try {
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
      } catch (txError) {
        console.error(`[GMAIL SYNC] Transaction failed for message ${gmailMessage.id} for user ${userId}:`, {
          error: txError instanceof Error ? txError.message : String(txError),
          messageId: gmailMessage.id,
          threadId: gmailMessage.threadId,
        });
        stats.failed++;
        continue; // Continue with next message instead of failing entire sync
      }

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
    try {
      await prisma.gmailToken.update({
        where: { userId },
        data: { 
          lastSyncedAt: new Date(),
          lastError: null,
          lastErrorAt: null,
        },
      });
    } catch (updateError) {
      // Log but don't fail sync if token update fails (token might have been deleted)
      console.warn(`[GMAIL SYNC] Failed to update GmailToken lastSyncedAt for user ${userId}:`, {
        error: updateError instanceof Error ? updateError.message : String(updateError),
      });
    }

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
    // Preserve original error details - don't throw generic error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`[GMAIL SYNC] Error during Gmail sync for user ${userId}:`, {
      error: errorMessage,
      stack: errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      isGmailNotConnected: error instanceof GmailNotConnectedError,
    });
    
    // Update GmailToken with error details
    try {
      await prisma.gmailToken.update({
        where: { userId },
        data: { 
          lastError: errorMessage.slice(0, 500), // Limit length
          lastErrorAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error(`[GMAIL SYNC] Failed to update GmailToken lastError for user ${userId}:`, updateError);
    }
    
    // Re-throw original error to preserve error type and details
    // This allows the controller to handle GmailNotConnectedError specifically
    throw error;
  }

  console.log(`Sync complete for user ${userId}:`, stats);
  return stats;
}
