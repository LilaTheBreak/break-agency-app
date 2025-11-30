import { Router } from "express";
import { calculateSuitabilityScore } from "../services/suitabilityService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/score", requireAuth, async (req, res) => {
  const { talent, brief } = req.body ?? {};

  if (!talent || !brief) {
    return res.status(400).json({ error: true, message: "talent and brief are required" });
  }

  const result = calculateSuitabilityScore(talent, brief);
  res.json(result);
});

export default router;
