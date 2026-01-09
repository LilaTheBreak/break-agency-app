import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

const MarkReadSchema = z.object({
  type: z.enum(["email", "dm"]),
  id: z.string().cuid(),
});

/**
 * POST /api/inbox/mark-read
 * Marks a specific email or DM as read.
 */
router.post("/api/inbox/mark-read", requireAuth, async (req: Request, res: Response) => {
  const parsed = MarkReadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  const { type, id } = parsed.data;

  try {
    if (type === "email") {
      await prisma.inboundEmail.update({ where: { id }, data: { isRead: true } });
    } else {
      await prisma.inboxMessage.update({ where: { id }, data: { isRead: true } });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to mark as read." });
  }
});

/**
 * POST /api/inbox/mark-unread
 * Marks a specific email or DM as unread.
 */
router.post("/api/inbox/mark-unread", requireAuth, async (req: Request, res: Response) => {
  const parsed = MarkReadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: "Invalid payload" });

  const { type, id } = parsed.data;
  if (type === "email") await prisma.inboundEmail.update({ where: { id }, data: { isRead: false } });
  else await prisma.inboxMessage.update({ where: { id }, data: { isRead: false } });

  return res.status(200).json({ success: true });
});

export default router;