import type { Request, Response, NextFunction } from "express";
import prisma from '../lib/prisma';

/**
 * Fetch a thread and all associated messages
 * Safe placeholder implementation
 */
export async function getThread(req: Request, res: Response, next: NextFunction) {
  try {
    const threadId = req.params.threadId;

    if (!threadId) {
      return res.status(400).json({ ok: false, error: "Thread ID missing" });
    }

    const messages = await prisma.inboxMessage.findMany({
      where: { threadId },
      orderBy: { receivedAt: "asc" },
    });

    res.json({
      ok: true,
      threadId,
      messageCount: messages.length,
      messages,
    });
  } catch (err) {
    console.error("INBOX THREAD ERROR:", err);
    next(err);
  }
}

/**
 * Optional: list threads for a user
 */
export async function listThreads(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Authentication required" });
    }

    const threads = await prisma.inboxMessage.findMany({
      where: { userId },
      distinct: ["threadId"],
      orderBy: { receivedAt: "desc" },
      take: 50,
      select: {
        threadId: true,
        receivedAt: true,
      },
    });

    res.json({
      ok: true,
      count: threads.length,
      threads,
    });
  } catch (err) {
    console.error("INBOX THREAD LIST ERROR:", err);
    next(err);
  }
}
