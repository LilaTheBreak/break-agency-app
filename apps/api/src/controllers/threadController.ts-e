import type { Request, Response, NextFunction } from "express";
import * as threadService from '../services/threads/threadService';
import * as summaryService from '../services/threads/threadSummaryService';

export async function listThreads(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;

    const threads = await threadService.listUnifiedThreads({ userId, page, limit });
    res.json(threads);
  } catch (error) {
    next(error);
  }
}

export async function getThreadDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { threadId } = req.params;
    const thread = await threadService.getUnifiedThreadById(threadId, req.user!.id);
    if (!thread) {
      res.status(404).json({ error: "Thread not found." });
      return;
    }
    res.json(thread);
  } catch (error) {
    next(error);
  }
}

export async function getThreadMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { threadId } = req.params;
    const messages = await threadService.getMessagesForThread(threadId, req.user!.id);
    if (!messages) {
      res.status(404).json({ error: "Thread not found." });
      return;
    }
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function summariseThread(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { threadId } = req.params;
    const summary = await summaryService.summarizeThread(threadId, req.user!.id);
    if (!summary) {
      res.status(404).json({ error: "Thread not found or could not be summarized." });
      return;
    }
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

export async function replyToThread(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { threadId } = req.params;
    const { body } = req.body;
    
    if (!body || typeof body !== 'string') {
      res.status(400).json({ error: "Message body is required" });
      return;
    }

    const reply = await threadService.sendReplyToThread(threadId, req.user!.id, body);
    res.json({ success: true, reply });
  } catch (error) {
    next(error);
  }
}