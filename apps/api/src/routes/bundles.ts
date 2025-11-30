import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateCreatorBundle } from "../services/creatorBundleService.js";

const router = Router();

router.post("/generate", requireAuth, async (req, res, next) => {
  try {
    const { brandPrediction } = req.body ?? {};
    const result = await generateCreatorBundle({
      userId: req.user!.id,
      brandPrediction
    });
    res.json({ bundle: result });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const bundle = await prisma.creatorBundle.findUnique({
      where: { id: req.params.id }
    });
    res.json({ bundle });
  } catch (error) {
    next(error);
  }
});

export default router;
