import prisma from "../../lib/prisma.js";
import { syncInboxForUser } from "./syncInbox.js";
import { GmailNotConnectedError } from "./tokens.js";

interface SyncResult {
  userId: string;
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  error?: string;
  duration: number;
}

/**
 * Background sync job - syncs Gmail for all connected users
 * Should be called by cron job or background worker
 */
export async function syncAllUsers(): Promise<SyncResult[]> {
  const startTime = Date.now();
  console.log("[GMAIL BACKGROUND SYNC] Starting sync for all users...");

  // Get all users with Gmail tokens
  const gmailTokens = await prisma.gmailToken.findMany({
    where: {
      refreshToken: { not: null }
    },
    select: { userId: true }
  });

  console.log(`[GMAIL BACKGROUND SYNC] Found ${gmailTokens.length} users with Gmail connected`);

  const results: SyncResult[] = [];

  for (const { userId } of gmailTokens) {
    const userStartTime = Date.now();
    try {
      console.log(`[GMAIL BACKGROUND SYNC] Syncing user ${userId}...`);
      
      const stats = await syncInboxForUser(userId);
      
      const duration = Date.now() - userStartTime;
      results.push({
        userId,
        success: true,
        ...stats,
        duration
      });

      // Update last sync timestamp
      await prisma.gmailToken.update({
        where: { userId },
        data: { lastSyncedAt: new Date() }
      });

      console.log(`[GMAIL BACKGROUND SYNC] ✓ User ${userId} synced: ${stats.imported} imported, ${stats.skipped} skipped (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - userStartTime;
      
      if (error instanceof GmailNotConnectedError) {
        console.warn(`[GMAIL BACKGROUND SYNC] ⚠ User ${userId} Gmail disconnected, skipping`);
        results.push({
          userId,
          success: false,
          imported: 0,
          updated: 0,
          skipped: 0,
          failed: 1,
          error: "gmail_disconnected",
          duration
        });
      } else {
        console.error(`[GMAIL BACKGROUND SYNC] ✗ User ${userId} sync failed:`, error);
        results.push({
          userId,
          success: false,
          imported: 0,
          updated: 0,
          skipped: 0,
          failed: 1,
          error: error instanceof Error ? error.message : "Unknown error",
          duration
        });
      }
    }

    // Rate limiting: Wait 1 second between users to avoid hitting Gmail API limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const totalDuration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
  
  console.log(`[GMAIL BACKGROUND SYNC] Complete: ${successful}/${results.length} users synced, ${totalImported} total messages imported (${totalDuration}ms)`);

  return results;
}

/**
 * Sync a single user's Gmail inbox
 * Can be called on-demand or by webhook
 */
export async function syncUser(userId: string): Promise<SyncResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[GMAIL SYNC] Syncing user ${userId}...`);
    
    const stats = await syncInboxForUser(userId);
    const duration = Date.now() - startTime;

    // Update last sync timestamp
    await prisma.gmailToken.update({
      where: { userId },
      data: { lastSyncedAt: new Date() }
    }).catch(() => {}); // Ignore error if token doesn't exist

    console.log(`[GMAIL SYNC] ✓ User ${userId} synced: ${stats.imported} imported (${duration}ms)`);

    return {
      userId,
      success: true,
      ...stats,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`[GMAIL SYNC] ✗ User ${userId} sync failed:`, error);
    
    return {
      userId,
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 1,
      error: error instanceof Error ? error.message : "Unknown error",
      duration
    };
  }
}
