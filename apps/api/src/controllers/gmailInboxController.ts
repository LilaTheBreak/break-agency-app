import type { Request, Response, NextFunction } from "express";
import * as inboxService from "../services/gmail/inboxService";
import { syncInboxForUser } from "../services/gmail/syncInbox";
import prisma from "../lib/prisma";

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
    if (!(await checkTokenAndHandleError(req.user!.id, res))) return;

    const stats = await syncInboxForUser(req.user!.id);
    res.json({ message: "Gmail inbox sync completed.", ...stats });
  } catch (error) {
    next(error);
  }
}
