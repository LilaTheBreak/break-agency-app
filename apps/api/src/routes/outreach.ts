import { Router } from "express";
import { outreachQueue } from "../worker/queues.js";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateLeadProspects } from "../services/ai/outreachAIService.js";
import { createOutreachForLead } from "../services/outreach/outreachService.js";

const router = Router();

router.post("/generate", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Auth required" });

  const plan = await prisma.outreachPlan.findMany({
    where: { userId, status: "pending" },
    take: 5
  });

  for (const p of plan) {
    await outreachQueue.add("outreach", {
      userId,
      outreachPlanId: p.id,
      dryRun: req.body?.dryRun ?? true
    });
  }

  res.json({ queued: plan.length });
});

router.post("/prospect", requireAuth, async (req, res) => {
  const { niche, count } = req.body ?? {};
  const leads = await generateLeadProspects(req.user, niche, count || 20);
  const created = await Promise.all(
    leads.map((l: any) =>
      prisma.lead.create({
        data: {
          userId: req.user!.id,
          brandName: l.brandName,
          brandWebsite: l.brandWebsite,
          brandEmail: l.brandEmail,
          industry: l.industry,
          score: l.score || 50
        }
      })
    )
  );
  res.json({ leads: created });
});

router.post("/start/:leadId", requireAuth, async (req, res) => {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.leadId } });
  if (!lead) return res.status(404).json({ error: true, message: "Lead not found" });
  const seq = await createOutreachForLead(lead, req.user);
  res.json({ sequence: seq });
});

router.patch("/sequence/:seqId/pause", requireAuth, async (req, res) => {
  await prisma.outreachSequence.update({
    where: { id: req.params.seqId },
    data: { status: "paused" }
  });
  res.json({ ok: true });
});

export default router;
