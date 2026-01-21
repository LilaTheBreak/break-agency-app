import type { Request, Response, NextFunction } from "express";
import * as inboxService from '../services/gmail/inboxService.js';
import { syncInboxForUser } from '../services/gmail/syncInbox.js';
import { GmailNotConnectedError } from '../services/gmail/tokens.js';
import prisma from '../lib/prisma.js';

async function checkTokenAndHandleError(userId: string, res: Response): Promise<boolean> {
  const token = await prisma.gmailToken.findUnique({ where: { userId } });
  if (!token) {
    res.status(404).json({
      error: "gmail_not_connected",
      message: "Gmail account is not connected. Please authenticate to continue."
    });
    return false;
  }
  return true;
}

export async function getInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await checkTokenAndHandleError(req.user!.id, res))) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const inboxThreads = await inboxService.fetchInboxThreads({
      userId: req.user!.id,
      page,
      limit
    });
    res.json(inboxThreads);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await checkTokenAndHandleError(req.user!.id, res))) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const inboxThreads = await inboxService.fetchInboxThreads({
      userId: req.user!.id,
      page,
      limit,
      unreadOnly: true
    });
    res.json(inboxThreads);
  } catch (error) {
    next(error);
  }
}

export async function searchInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await checkTokenAndHandleError(req.user!.id, res))) return;

    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: "Search query 'q' is required." });
      return;
    }
    const results = await inboxService.searchThreads(req.user!.id, query);
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function getThreadById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await checkTokenAndHandleError(req.user!.id, res))) return;

    const { threadId } = req.params;
    const thread = await inboxService.fetchThreadDetails(req.user!.id, threadId);
    if (!thread) {
      res.status(404).json({ error: "Thread not found." });
      return;
    }
    res.json(thread);
  } catch (error) {
    next(error);
  }
}

export async function syncInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log("[INTEGRATION] Gmail inbox sync requested", {
      userId: req.user!.id,
      timestamp: new Date().toISOString()
    });
    
    if (!(await checkTokenAndHandleError(req.user!.id, res))) return;

    const stats = await syncInboxForUser(req.user!.id);
    
    console.log("[INTEGRATION] Gmail inbox sync completed", {
      userId: req.user!.id,
      imported: stats.imported,
      contactsCreated: stats.contactsCreated,
      brandsCreated: stats.brandsCreated,
      timestamp: new Date().toISOString()
    });
    
    // Build summary message
    const totalProcessed = stats.imported + stats.skipped + stats.failed;
    let summary = "";
    if (totalProcessed === 0) {
      summary = "No new messages to sync";
    } else if (stats.failed > 0) {
      summary = `${stats.imported} imported, ${stats.skipped} skipped (duplicates), ${stats.failed} failed (errors)`;
    } else {
      summary = `${stats.imported} imported, ${stats.skipped} skipped (duplicates)`;
    }
    
    res.json({ 
      message: "Gmail inbox sync completed.", 
      success: true,
      summary,
      stats: {
        imported: stats.imported,
        updated: stats.updated,
        skipped: stats.skipped,
        failed: stats.failed,
        contactsCreated: stats.contactsCreated,
        brandsCreated: stats.brandsCreated,
        linkErrors: stats.linkErrors,
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[INTEGRATION] Gmail inbox sync failed", {
      userId: req.user!.id,
      error: errorMessage,
      errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      timestamp: new Date().toISOString()
    });
    
    // Handle Gmail not connected error specifically
    if (error instanceof GmailNotConnectedError) {
      res.status(404).json({
        error: "gmail_not_connected",
        message: "Gmail account is not connected. Please authenticate to continue."
      });
      return;
    }
    
    // Handle OAuth errors specifically
    if (error instanceof Error && (
      error.message.includes("invalid_grant") ||
      error.message.includes("Token has been expired") ||
      error.message.includes("invalid_client") ||
      error.message.includes("unauthorized") ||
      error.message.includes("access_denied")
    )) {
      res.status(401).json({
        error: "gmail_auth_expired",
        message: "Gmail authentication has expired. Please reconnect your Gmail account."
      });
      return;
    }
    
    // Handle database errors
    if (error instanceof Error && (
      error.message.includes("Unique constraint") ||
      error.message.includes("Foreign key constraint") ||
      error.message.includes("Record to update not found")
    )) {
      console.error("[INTEGRATION] Database error during Gmail sync:", errorMessage);
      res.status(500).json({
        error: "database_error",
        message: "A database error occurred during sync. Please try again."
      });
      return;
    }
    
    // Handle Google API errors (return 200 OK with error details, not 503)
    if (error instanceof Error && (
      error.message.includes("quota") ||
      error.message.includes("rate limit") ||
      error.message.includes("403") ||
      error.message.includes("429")
    )) {
      res.status(200).json({
        success: false,
        error: "gmail_api_limit",
        message: "Gmail API rate limit exceeded. Please try again in a few minutes.",
        summary: "0 imported, 0 skipped, 0 failed (rate limit)",
        stats: {
          imported: 0,
          updated: 0,
          skipped: 0,
          failed: 0,
          contactsCreated: 0,
          brandsCreated: 0,
          linkErrors: 0,
        }
      });
      return;
    }
    
    // Generic error response (don't expose internal details)
    res.status(500).json({
      error: "sync_failed",
      message: "Gmail sync failed. Please try again or contact support if the issue persists."
    });
  }
}

export async function autoDiscoverBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    
    if (!(await checkTokenAndHandleError(userId, res))) return;

    // Import the auto-discovery service
    const { listAndFetchMessages } = await import('../services/gmail/fetchMessages.js');
    const { autoDiscoverBrandsFromInbox } = await import('../services/gmail/autoDiscoverBrands.js');

    // Fetch the user's inbox messages
    const messages = await listAndFetchMessages(userId);
    if (!messages) {
      console.error("[AUTO DISCOVER] Failed to fetch messages for user:", userId);
      res.status(401).json({
        error: "gmail_auth_failed",
        message: "Failed to authenticate with Gmail. Please reconnect your account."
      });
      return;
    }

    if (messages.length === 0) {
      console.log("[AUTO DISCOVER] No messages found in inbox for user:", userId);
      res.json({
        success: true,
        discovered: 0,
        created: 0,
        results: [],
        message: "No messages found in inbox."
      });
      return;
    }

    console.log("[AUTO DISCOVER] Found", messages.length, "messages for user:", userId);

    // Run auto-discovery
    const result = await autoDiscoverBrandsFromInbox(messages, userId);

    console.log("[AUTO DISCOVER] Discovery complete:", { discovered: result.discovered, created: result.created });

    res.json({
      success: true,
      discovered: result.discovered,
      created: result.created,
      results: result.results,
      message: `Discovered ${result.discovered} business domains and created ${result.created} new brands.`
    });
  } catch (error) {
    console.error("[AUTO DISCOVER] Unexpected error:", error);
    next(error);
  }
}
