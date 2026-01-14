import { Router, type Request, type Response } from "express";
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { z } from "zod";

const router = Router();

const AssignSchema = z.object({
  type: z.enum(["email", "dm"]),
  id: z.string().cuid(),
  assigneeId: z.string().cuid(),
});

/**
 * POST /api/inbox/assign
 * Assigns an inbox item to a specific user (agent).
 */
router.post("/api/inbox/assign", requireAuth, async (req: Request, res: Response) => {
  const parsed = AssignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  const { type, id, assigneeId } = parsed.data;

  try {
    if (type === "email") {
      await prisma.inboundEmail.update({ where: { id }, data: { userId: assigneeId } });
    } else {
      await prisma.inboxMessage.update({ where: { id }, data: { userId: assigneeId } });
    }
    res.status(200).json({ success: true, message: "Item assigned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to assign item." });
  }
});

export default router;