import { Router } from "express";
import { requireAuth } from '../middleware/auth';
import { detectRisks } from '../services/riskService';

const router = Router();

router.post("/check", requireAuth, async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text : "";
  if (!text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const result = detectRisks(text);
  return res.json(result);
});

export default router;
