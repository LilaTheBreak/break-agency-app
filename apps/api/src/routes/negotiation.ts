import { Router } from "express";
import { generateNegotiationInsight } from "../services/negotiationInsightsService.js";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { negotiationSessionQueue } from "../worker/queues.js";

const router = Router();

router.post("/generate/:dealDraftId", async (req, res) => {
  try {
    const insight = await generateNegotiationInsight(req.params.dealDraftId);
    res.json({ insight });
  } catch (e) {
    res.status(500).json({ error: "Negotiation generation failed" });
  }
});

router.get("/user/:userId", async (req, res) => {
  const insights = await prisma.negotiationInsight.findMany({
    where: { dealDraft: { userId: req.params.userId } },
    orderBy: { createdAt: "desc" },
    include: { dealDraft: true }
  });
  res.json({ insights });
});

router.post("/:sessionId/step", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Auth required" });
  const { sessionId } = req.params;
  const { step } = req.body;

  await negotiationSessionQueue.add("nego-manual", {
    userId,
    sessionId,
    step: step || "initial"
  });

  res.json({ queued: true });
});

router.get("/thread/:id", requireAuth, async (req, res) => {
  // negotiationThread model not implemented yet
  // Use DealNegotiation instead for tracking negotiation state
  res.status(501).json({ error: "Feature not yet implemented" });
  // const thread = await prisma.negotiationThread.findUnique({
  //   where: { id: req.params.id },
  //   include: { messages: true }
  // });
  // if (!thread) return res.status(404).json({ error: true });
  // res.json({ thread });
});

export default router;
