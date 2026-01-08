import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { suggestReply } from "../services/dealNegotiationService.js";

const router = Router();

router.post("/suggest", requireAuth, async (req, res, next) => {
  try {
    const { dealId } = req.body ?? {};
    if (!dealId) {
      return res.status(400).json({ error: true, message: "dealId required" });
    }
    const result = await suggestReply(dealId, req.user!.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
