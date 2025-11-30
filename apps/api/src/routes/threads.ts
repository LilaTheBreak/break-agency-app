import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { rebuildDealThreads, getThreads, getThread } from "../services/dealThreadService.js";
import { inferStageFromEmail } from "../services/dealStageService.js";

const router = Router();

router.post("/rebuild", requireAuth, async (req, res, next) => {
  try {
    const threads = await rebuildDealThreads(req.user!.id);
    res.json({ threads });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const threads = await getThreads(req.user!.id);
    res.json({ threads });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const thread = await getThread(req.user!.id, req.params.id);
    res.json({ thread });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/refresh-stage", requireAuth, async (req, res, next) => {
  try {
    const thread = await prisma.dealThread.findUnique({
      where: { id: req.params.id },
      include: { emails: true }
    });
    if (!thread) return res.status(404).json({ error: true });
    const latest = thread.emails.at(-1);
    if (!latest) return res.status(400).json({ error: true, message: "No emails in thread" });
    const stage = inferStageFromEmail(latest);
    await prisma.dealThread.update({
      where: { id: thread.id },
      data: { stage }
    });
    res.json({ stage });
  } catch (error) {
    next(error);
  }
});

export default router;
