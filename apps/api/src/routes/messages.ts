import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/messages/threads", requireUser, async (req: Request, res: Response) => {
  const currentUserId = req.user?.id as string;
  const threads = await buildThreadsForUser(currentUserId);
  res.json({ threads });
});

router.get("/messages/thread/:userId", requireUser, async (req: Request, res: Response) => {
  const currentUserId = req.user?.id as string;
  const targetId = String(req.params.userId);
  const threads = await buildThreadsForUser(currentUserId, targetId);
  if (!threads.length) {
    return res.json({ thread: createEmptyThread(currentUserId, targetId) });
  }
  res.json({ thread: threads[0] });
});

router.post("/messages/send", requireUser, async (req: Request, res: Response) => {
  const currentUserId = req.user?.id as string;
  const { recipientId, content } = req.body ?? {};
  if (!recipientId || typeof recipientId !== "string") {
    return res.status(400).json({ error: "recipientId is required" });
  }
  const body = typeof content === "string" ? content.trim() : "";
  if (!body) {
    return res.status(400).json({ error: "content is required" });
  }

  const message = await prisma.message.create({
    data: {
      senderId: currentUserId,
      recipientId,
      content: body,
      read: false
    }
  });

  res.status(201).json({ message });
});

router.patch("/messages/:id/read", requireUser, async (req: Request, res: Response) => {
  const currentUserId = req.user?.id as string;
  const messageId = String(req.params.id);
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }
  if (message.recipientId !== currentUserId) {
    return res.status(403).json({ error: "Only the recipient can mark messages as read" });
  }
  if (message.read) {
    return res.json({ message });
  }
  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { read: true }
  });
  res.json({ message: updated });
});

export default router;

async function buildThreadsForUser(currentUserId: string, targetId?: string) {
  const messageWhere = targetId
    ? {
        OR: [
          { senderId: currentUserId, recipientId: targetId },
          { senderId: targetId, recipientId: currentUserId }
        ]
      }
    : {
        OR: [{ senderId: currentUserId }, { recipientId: currentUserId }]
      };

  const messages = await prisma.message.findMany({
    where: messageWhere,
    orderBy: { createdAt: "asc" },
    take: targetId ? undefined : 500
  });

  const counterpartIds = new Set(
    messages.map((message) => (message.senderId === currentUserId ? message.recipientId : message.senderId))
  );
  if (targetId) {
    counterpartIds.add(targetId);
  }
  counterpartIds.delete(currentUserId);

  const users = counterpartIds.size
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(counterpartIds) } },
        select: { id: true, name: true, accountType: true, status: true }
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  const threads = Array.from(counterpartIds).map((counterpartId) => {
    const user = userMap.get(counterpartId);
    return createEmptyThread(currentUserId, counterpartId, user);
  });

  const threadMap = new Map(threads.map((thread) => [thread.id, thread]));

  for (const message of messages) {
    const otherId = message.senderId === currentUserId ? message.recipientId : message.senderId;
    if (!otherId || !threadMap.has(otherId)) continue;
    const thread = threadMap.get(otherId)!;
    const senderUser =
      message.senderId === otherId ? userMap.get(otherId) : userMap.get(message.senderId ?? "");
    const mapped = mapMessage(message, currentUserId, senderUser);
    thread.messages.push(mapped);
    thread.lastUpdated = mapped.timestamp;
  }

  return threads
    .map((thread) => ({
      ...thread,
      preview: thread.messages.at(-1)?.body ?? "",
      unreadCount: thread.messages.filter(
        (message) => message.recipientId === currentUserId && !message.read
      ).length
    }))
    .sort((a, b) => {
      const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return bTime - aTime;
    });
}

function mapMessage(
  message: { id: string; senderId: string; recipientId: string; content: string; read: boolean; createdAt: Date },
  currentUserId: string,
  senderUser?: { accountType: string | null; status: string | null }
) {
  const readBy = [message.senderId];
  if (message.read) readBy.push(message.recipientId);
  return {
    id: message.id,
    senderId: message.senderId,
    recipientId: message.recipientId,
    senderRole:
      message.senderId === currentUserId
        ? "You"
        : formatPersona(senderUser?.accountType || senderUser?.status || "Contact"),
    body: message.content,
    attachments: [],
    timestamp: message.createdAt,
    read: message.read,
    readBy
  };
}

function createEmptyThread(
  currentUserId: string,
  counterpartId: string,
  user?: { name: string | null; accountType: string | null; status: string | null }
) {
  return {
    id: counterpartId,
    subject: user?.name || counterpartId,
    persona: formatPersona(user?.accountType || user?.status || "Conversation"),
    participants: [currentUserId, counterpartId],
    messages: [] as Array<ReturnType<typeof mapMessage>>,
    lastUpdated: null,
    preview: "",
    unreadCount: 0
  };
}

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function formatPersona(value?: string | null) {
  if (!value) return "Conversation";
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
