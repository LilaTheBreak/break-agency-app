import { Router } from "express";
import { extractDealTerms } from "../services/aiDealExtractor.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/deal-extract", requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body ?? {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: true, message: "text is required" });
    }

    const data = await extractDealTerms({ text });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
