import { Router } from "express";
import prisma from '../lib/prisma.js';
import { extractDealFromEmail } from '../services/dealExtractionService.js';
import { dealExtractionQueue } from '../worker/queues.js';

const router = Router();

router.post("/extract/:emailId", async (req, res) => {
  try {
    const drafts = await extractDealFromEmail(req.params.emailId);
    return res.json({ drafts });
  } catch (e) {
    res.status(500).json({ error: true, message: "Deal extraction failed" });
  }
});

router.post("/extract/:emailId/async", async (req, res) => {
  await dealExtractionQueue.add("extract", { emailId: req.params.emailId });
  return res.json({ queued: true });
});

router.get("/user/:userId", async (req, res) => {
  const drafts = await prisma.dealDraft.findMany({
    where: { userId: req.params.userId },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ drafts });
});

export default router;
