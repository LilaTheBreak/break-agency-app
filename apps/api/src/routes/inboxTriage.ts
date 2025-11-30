import { Router } from "express";
import prisma from "../lib/prisma.js";
import { runEmailTriage } from "../services/aiTriageService.js";
import { triageQueue } from "../worker/queues.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/triage/:emailId", requireAuth, async (req, res) => {
  try {
    const emailId = req.params.emailId;
    const result = await runEmailTriage(emailId);
    res.json({ email: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: "Triage failed" });
  }
});

router.post("/triage/:emailId/async", requireAuth, async (req, res) => {
  const emailId = req.params.emailId;
  await triageQueue.add("triage", { emailId });
  res.json({ queued: true });
});

router.post("/triage/user/:userId", requireAuth, async (req, res) => {
  const emails = await prisma.inboundEmail.findMany({
    where: { userId: req.params.userId }
  });

  for (const e of emails) {
    await triageQueue.add("triage", { emailId: e.id });
  }

  res.json({ queued: emails.length });
});

export default router;
