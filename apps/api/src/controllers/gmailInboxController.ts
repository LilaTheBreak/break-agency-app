import type { Request, Response, NextFunction } from "express";
import * as inboxService from "../services/gmail/inboxService.js";
import { syncInboxForUser } from "../services/gmail/syncInbox.js";
import { GmailNotConnectedError } from "../services/gmail/tokens.js";
import prisma from "../lib/prisma.js";

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
    
    res.json({ 
      message: "Gmail inbox sync completed.", 
      success: true,
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
    console.error("[INTEGRATION] Gmail inbox sync failed", {
      userId: req.user!.id,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
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
      error.message.includes("invalid_client")
    )) {
      res.status(401).json({
        error: "gmail_auth_expired",
        message: "Gmail authentication has expired. Please reconnect your Gmail account."
      });
      return;
    }
    
    next(error);
  }
}
