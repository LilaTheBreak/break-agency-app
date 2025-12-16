import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as messageService from "../services/messageService";
import * as threadService from "../services/threads/threadService"; // Corrected path

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const messages = await messageService.listRecentMessages(req.user!.id);
    res.json({ ok: true, data: messages });
  } catch (error) {
    next(error);
  }
}

export async function getMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const message = await messageService.getMessageById(req.params.id, req.user!.id);
    if (!message) {
      return res.status(404).json({ ok: false, error: "Message not found" });
    }
    res.json({ ok: true, data: message });
  } catch (error) {
    next(error);
  }
}

export async function getThread(req: Request, res: Response, next: NextFunction) {
  try {
    const messages = await threadService.getMessagesForThread(req.params.threadId, req.user!.id);
    if (!messages) {
      return res.status(404).json({ ok: false, error: "Thread not found" });
    }
    res.json({ ok: true, data: messages });
  } catch (error) {
    next(error);
  }
}

const SendMessageSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }
    const sentMessage = await messageService.sendMessage({
      ...parsed.data,
      userId: req.user!.id,
    });
    res.status(201).json({ ok: true, data: sentMessage });
  } catch (error) {
    next(error);
  }
}

const ReplySchema = z.object({
  threadId: z.string(),
  body: z.string().min(1),
});

export async function replyToThread(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", details: parsed.error.flatten() });
    }

    const thread = await threadService.getUnifiedThreadById(parsed.data.threadId, req.user!.id);
    if (!thread) {
      return res.status(404).json({ ok: false, error: "Thread not found" });
    }

    const sentMessage = await messageService.sendMessage({
      userId: req.user!.id,
      to: thread.participants.find(p => !p.includes(req.user!.email!)) || "", // Simplified recipient logic
      subject: `Re: ${thread.subject}`,
      body: parsed.data.body,
      threadId: parsed.data.threadId,
    });
    res.status(201).json({ ok: true, data: sentMessage });
  } catch (error) {
    next(error);
  }
}