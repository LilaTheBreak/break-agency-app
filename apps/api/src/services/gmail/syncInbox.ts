import { gmail_v1 as gmailV1, google } from "googleapis";
import prisma from '../../lib/prisma';
import { getOAuthClientForUser, GmailNotConnectedError } from './tokens';
import { mapGmailMessageToDb } from './mappings';
import { linkEmailToCrm } from './linkEmailToCrm';
// import { logAuditEvent } from '../../lib/auditLogger'; // No req context in service

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
    console.log(`[GMAIL SYNC] Listing messages from Gmail API (query: "in:inbox", maxResults: 100)...`);
    listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100, // Fetch more messages to ensure comprehensive sync
    q: "in:inbox"
  });
    console.log(`[GMAIL SYNC] Gmail API list response:`, {
      resultSizeEstimate: listResponse.data.resultSizeEstimate,
      messagesCount: listResponse.data.messages?.length || 0,
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
    console.log(`[GMAIL SYNC] No messages found in Gmail inbox (resultSizeEstimate: ${listResponse.data.resultSizeEstimate})`);
    return [];
  }
  
  console.log(`[GMAIL SYNC] Found ${messages.length} message IDs, fetching full details...`);

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
  
  console.log(`[GMAIL SYNC] Successfully fetched ${validMessages.length} full message details`);
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
      console.log(`[GMAIL SYNC] Fetching messages from Gmail API for user ${userId}...`);
      gmailMessages = await fetchRecentMessages(gmail);
      console.log(`[GMAIL SYNC] Fetched ${gmailMessages.length} messages from Gmail API for user ${userId}`);
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
      console.log(`[GMAIL SYNC] Checking for duplicates: ${gmailIds.length} message IDs for user ${userId}`);
      if (gmailIds.length > 0) {
        try {
          // Prisma has a limit on `in` queries (typically 1000), but we're only fetching 100 messages
          // Split into chunks if needed for safety (though 100 should be fine)
          const chunkSize = 100;
          for (let i = 0; i < gmailIds.length; i += chunkSize) {
            const chunk = gmailIds.slice(i, i + chunkSize);
            const existingEmails = await prisma.inboundEmail.findMany({
              where: { 
                gmailId: { in: chunk },
                userId: userId // Also filter by userId for safety
              },
          select: { gmailId: true }
            });
            existingEmails.forEach((e) => {
              if (e.gmailId) existingGmailIds.add(e.gmailId);
            });
          }
          console.log(`[GMAIL SYNC] Found ${existingGmailIds.size} existing emails (duplicates) for user ${userId} out of ${gmailIds.length} checked`);
        } catch (dbError) {
          console.error(`[GMAIL SYNC] Failed to check existing emails for user ${userId}:`, {
            error: dbError instanceof Error ? dbError.message : String(dbError),
            errorCode: (dbError as any)?.code,
            gmailIdsCount: gmailIds.length,
            stack: dbError instanceof Error ? dbError.stack?.substring(0, 500) : undefined,
          });
          // Continue with sync even if we can't check duplicates
          // Duplicates will be caught by P2002 errors during insert
        }
      }
    } else {
      console.log(`[GMAIL SYNC] No messages fetched from Gmail API for user ${userId} - inbox may be empty or query returned no results`);
    }

    console.log(`[GMAIL SYNC] Processing ${gmailMessages.length} messages for user ${userId}...`);
    for (const gmailMessage of gmailMessages) {
      // Skip messages missing required fields (soft failure - malformed Gmail response)
      if (!gmailMessage.id || !gmailMessage.threadId) {
        console.warn(`[GMAIL SYNC] Skipping message missing id or threadId for user ${userId}:`, {
          hasId: !!gmailMessage.id,
          hasThreadId: !!gmailMessage.threadId,
          messageId: gmailMessage.id || 'unknown',
        });
        stats.skipped++; // Changed from failed to skipped - this is a soft failure
        continue;
      }

      // Skip duplicates (already imported)
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
        // Mapping errors are hard failures - message structure is invalid
        console.error(`[GMAIL SYNC] Failed to map message ${gmailMessage.id} for user ${userId}:`, {
          error: mapError instanceof Error ? mapError.message : String(mapError),
          messageId: gmailMessage.id,
          threadId: gmailMessage.threadId,
          reason: 'mapping_error',
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
            body: inboundEmailData.body,
            inboxMessageId: thread.id,
          },
          create: { ...inboundEmailData, inboxMessageId: thread.id },
        });
      });
        stats.imported++;
        if (stats.imported % 10 === 0 || stats.imported === 1) {
          console.log(`[GMAIL SYNC] Imported ${stats.imported} message${stats.imported !== 1 ? 's' : ''} so far for user ${userId}...`);
        }
      } catch (txError: any) {
        const errorCode = txError?.code;
        const errorMessage = txError instanceof Error ? txError.message : String(txError);
        const errorName = txError?.name || '';
        const meta = txError?.meta || {};
        
        // Check if this is a duplicate key error (P2002) - should be skipped, not failed
        // Prisma can return P2002 for unique constraint violations
        // Also check error message for duplicate/unique constraint keywords
        const isDuplicateError = 
          errorCode === 'P2002' ||
          errorCode === '23505' || // PostgreSQL unique violation
          errorMessage.toLowerCase().includes('unique constraint') ||
          errorMessage.toLowerCase().includes('duplicate key') ||
          errorMessage.toLowerCase().includes('already exists') ||
          (meta?.target && Array.isArray(meta.target) && meta.target.includes('gmailId'));
        
        if (isDuplicateError) {
          console.warn(`[GMAIL SYNC] Duplicate key error for message ${gmailMessage.id} (likely race condition or duplicate) - skipping:`, {
            messageId: gmailMessage.id,
            threadId: gmailMessage.threadId,
            errorCode,
            errorName,
            constraint: meta?.target,
            errorMessage: errorMessage.substring(0, 200), // Truncate for logging
          });
          stats.skipped++; // Duplicate key = soft failure, count as skipped
          continue;
        }
        
        // All other transaction errors are hard failures
        console.error(`[GMAIL SYNC] Transaction failed for message ${gmailMessage.id} for user ${userId}:`, {
          error: errorMessage,
          messageId: gmailMessage.id,
          threadId: gmailMessage.threadId,
          errorCode,
          errorName,
          constraint: meta?.target,
          stack: txError instanceof Error ? txError.stack?.substring(0, 500) : undefined,
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

  const totalProcessed = stats.imported + stats.skipped + stats.failed;
  console.log(`[GMAIL SYNC] Sync complete for user ${userId}:`, {
    imported: stats.imported,
    updated: stats.updated,
    skipped: stats.skipped,
    failed: stats.failed,
    contactsCreated: stats.contactsCreated,
    brandsCreated: stats.brandsCreated,
    linkErrors: stats.linkErrors,
    totalProcessed,
    summary: stats.failed > 0 
      ? `${stats.imported} imported, ${stats.skipped} skipped (duplicates/malformed), ${stats.failed} failed (hard errors)`
      : `${stats.imported} imported, ${stats.skipped} skipped (duplicates/malformed)`,
  });
  
  // Log warning if all messages failed - this suggests a systemic issue
  if (stats.failed > 0 && stats.imported === 0 && stats.skipped === 0) {
    console.error(`[GMAIL SYNC] ⚠️ WARNING: All ${stats.failed} messages failed for user ${userId}. This suggests a systemic issue (mapping errors, DB constraints, etc.). Check logs above for details.`);
  }
  
  // Log warning if high failure rate
  if (stats.failed > 0 && totalProcessed > 0) {
    const failureRate = (stats.failed / totalProcessed) * 100;
    if (failureRate > 50) {
      console.error(`[GMAIL SYNC] ⚠️ WARNING: High failure rate (${failureRate.toFixed(1)}%) for user ${userId}. ${stats.failed}/${totalProcessed} messages failed.`);
    }
  }
  
  return stats;
}
