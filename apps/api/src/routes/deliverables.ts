import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createDeliverable,
  updateDeliverable,
  runDeliverableQA,
  predictDeliverablePerformance,
  createDeliverablesFromContract,
  updateDeliverableStatus,
  listDeliverablesForUser
} from "../services/deliverableService.js";
import prisma from "../lib/prisma.js";
import { deliverableReviewQueue } from "../worker/queues.js";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { dealId, type, caption, notes, scheduledAt } = req.body ?? {};
    if (!dealId || !type) {
      return res.status(400).json({ error: true, message: "dealId and type are required" });
    }
    const d = await createDeliverable(dealId, { type, caption, notes, scheduledAt });
    return res.json({ deliverable: d });
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { dealId } = req.query;
    if (typeof dealId === "string" && dealId) {
      const items = await prisma.deliverableItem.findMany({
        where: { dealId },
        orderBy: { createdAt: "desc" }
      });
      return res.json({ deliverables: items });
    }

    const data = await listDeliverablesForUser(req.user!.id);
    return res.json({ deliverables: data });
  } catch (error) {
    next(error);
  }
});

router.post("/from-contract/:contractId", requireAuth, async (req, res, next) => {
  try {
    const result = await createDeliverablesFromContract(req.params.contractId);
    return res.json({ created: result.count });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!status) {
      return res.status(400).json({ error: true, message: "status is required" });
    }
    const updated = await updateDeliverableStatus(req.params.id, status);
    return res.json({ deliverable: updated });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const d = await updateDeliverable(req.params.id, req.body);
    return res.json({ deliverable: d });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/qa", requireAuth, async (req, res, next) => {
  try {
    const result = await runDeliverableQA(req.params.id);
    res.json({ qa: result });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/predict", requireAuth, async (req, res, next) => {
  try {
    const result = await predictDeliverablePerformance(req.params.id);
    res.json({ prediction: result });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/review", requireAuth, async (req, res, next) => {
  try {
    const { content } = req.body ?? {};
    if (!content) return res.status(400).json({ error: true, message: "content is required" });
    const job = await deliverableReviewQueue.add("review", {
      deliverableId: req.params.id,
      content,
      userId: req.user!.id
    });
    res.json({ queued: true, jobId: job.id });
  } catch (error) {
    next(error);
  }
});

// TODO: DeliverableReview model not implemented yet
// router.get("/:id/reviews", requireAuth, async (req, res, next) => {
//   try {
//     const reviews = await prisma.deliverableReview.findMany({
//       where: { deliverableId: req.params.id },
//       orderBy: { createdAt: "desc" }
//     });
//     res.json({ reviews });
//   } catch (error) {
//     next(error);
//   }
// });

export default router;
