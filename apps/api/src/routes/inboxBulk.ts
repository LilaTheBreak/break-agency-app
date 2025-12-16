import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

const BulkActionSchema = z.object({
  action: z.enum(["mark-read", "mark-unread", "archive", "delete"]),
  items: z.array(z.object({
    type: z.enum(["email", "dm"]),
    id: z.string().cuid(),
  })).min(1),
});

/**
 * POST /api/inbox/bulk
 * Performs a bulk action on multiple inbox items.
 */
router.post("/api/inbox/bulk", requireAuth, async (req: Request, res: Response) => {
  const parsed = BulkActionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }

  const { action, items } = parsed.data;
  const emailIds = items.filter(i => i.type === 'email').map(i => i.id);
  const dmIds = items.filter(i => i.type === 'dm').map(i => i.id);

  try {
    await prisma.$transaction(async (tx) => {
      switch (action) {
        case "mark-read":
          if (emailIds.length) await tx.inboundEmail.updateMany({ where: { id: { in: emailIds } }, data: { isRead: true } });
          if (dmIds.length) await tx.inboxMessage.updateMany({ where: { id: { in: dmIds } }, data: { openedAt: new Date() } });
          break;
        case "mark-unread":
          if (emailIds.length) await tx.inboundEmail.updateMany({ where: { id: { in: emailIds } }, data: { isRead: false } });
          if (dmIds.length) await tx.inboxMessage.updateMany({ where: { id: { in: dmIds } }, data: { openedAt: null } });
          break;
        case "archive":
          // Appends 'archived' to the categories array
          if (emailIds.length) {
            const emails = await tx.inboundEmail.findMany({ where: { id: { in: emailIds } } });
            for (const email of emails) {
              await tx.inboundEmail.update({ where: { id: email.id }, data: { categories: { push: 'archived' } } });
            }
          }
          // DMs don't have categories, so this is a no-op for them.
          break;
        case "delete":
          // Soft delete by setting a metadata flag
          if (emailIds.length) await tx.inboundEmail.updateMany({ where: { id: { in: emailIds } }, data: { metadata: { deleted: true } } });
          // DMs don't have metadata, so this is a no-op for them.
          break;
      }
    });

    res.status(200).json({ success: true, message: `Bulk action '${action}' completed.` });
  } catch (error) {
    res.status(500).json({ success: false, error: "Bulk action failed." });
  }
});

export default router;