import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateDealPackage } from "../services/dealPackageService.js";

const router = Router();

router.post("/generate", requireAuth, async (req, res, next) => {
  try {
    const { creatorId, brandPrediction, context } = req.body ?? {};
    const pkg = await generateDealPackage({
      userId: req.user!.id,
      creatorId,
      brandPrediction,
      context
    });
    res.json({ package: pkg });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const pkg = await prisma.dealPackage.findUnique({
      where: { id: req.params.id }
    });
    res.json({ package: pkg });
  } catch (error) {
    next(error);
  }
});

export default router;
