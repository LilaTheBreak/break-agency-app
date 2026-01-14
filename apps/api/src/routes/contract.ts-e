import { Router } from "express";
import { processContract } from '../services/contractReader';
import { requireAuth } from '../middleware/auth';
import prisma from '../lib/prisma';
import { enqueueContractProcessing } from '../services/aiAgent/contractRunner';
import { contractFinalisationQueue } from '../worker/queues';
import { initiateSignature } from '../services/signature/orchestrator';

const router = Router();

router.post("/process", requireAuth, async (req, res, next) => {
  try {
    const { fileUrl, dealId } = req.body ?? {};
    if (!fileUrl || !dealId) {
      return res.status(400).json({ error: true, message: "fileUrl and dealId required" });
    }
    const result = await processContract(fileUrl, dealId, req.user!.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/submit", requireAuth, async (req, res) => {
  const { fileId, contractText } = req.body ?? {};
  if (!fileId || !contractText) return res.status(400).json({ error: "fileId and contractText required" });
  const contract = await prisma.contractReview.create({
    data: {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user!.id,
      fileId,
      contractText,
      updatedAt: new Date()
    }
  });
  await enqueueContractProcessing(req.user!.id, contract.id);
  res.json({ contractId: contract.id });
});

router.get("/:id", requireAuth, async (req, res) => {
  const contract = await prisma.contractReview.findUnique({
    where: { id: req.params.id }
  });
  if (!contract) return res.status(404).json({ error: "Not found" });
  res.json({ contract });
});

// Generated contract fetch
router.get("/generated/:id", requireAuth, async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id }
  });
  if (!contract) return res.status(404).json({ error: "Not found" });
  res.json({ contract });
});

router.post("/generated/:id/finalise", requireAuth, async (req, res) => {
  await prisma.contract.update({
    where: { id: req.params.id },
    data: { status: "ready" }
  });
  res.json({ success: true });
});

router.post("/generated/:id/build", requireAuth, async (req, res) => {
  const { terms, dealId, threadId } = req.body ?? {};
  await contractFinalisationQueue.add("contract-finalise", {
    userId: req.user!.id,
    dealId: dealId || null,
    threadId: threadId || null,
    terms
  });
  res.json({ queued: true });
});

router.post("/:id/signature", requireAuth, async (req, res) => {
  const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!contract) return res.status(404).json({ error: true });
  if (!contract.pdfUrl) return res.status(400).json({ error: true, message: "Contract PDF missing" });
  const result = await initiateSignature(contract);
  res.json(result);
});

router.get("/:id/signature/status", requireAuth, async (req, res) => {
  const requests = await prisma.signatureRequest.findMany({
    where: { contractId: req.params.id },
    orderBy: { createdAt: "desc" }
  });
  res.json({ requests });
});

export default router;
