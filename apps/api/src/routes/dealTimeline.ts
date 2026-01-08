import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:dealId", requireAuth, async (req, res, next) => {
  try {
    const { dealId } = req.params;
    const events = await prisma.dealTimeline.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" }
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

router.post("/:dealId/note", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    const { dealId } = req.params;
    const { message } = req.body ?? {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message is required" });
    }
    const event = await prisma.dealTimeline.create({
      data: {
        dealId,
        type: "NOTE",
        createdById: user.id,
        message: String(message).trim()
      }
    });
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

export default router;
