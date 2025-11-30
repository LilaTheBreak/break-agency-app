import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ingestBrief } from "../services/brandBriefService.js";

const router = Router();

router.post("/ingest", requireAuth, async (req, res, next) => {
  try {
    const { brandName, rawText, contactEmail } = req.body ?? {};
    const brief = await ingestBrief({
      brandName,
      rawText,
      contactEmail,
      submittedBy: req.user!.id
    });
    res.json({ brief });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const brief = await prisma.brandBrief.findUnique({
      where: { id: req.params.id },
      include: { matches: true }
    });
    res.json({ brief });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/matches", requireAuth, async (req, res, next) => {
  try {
    const matches = await prisma.briefMatch.findMany({
      where: { briefId: req.params.id },
      include: { user: true },
      orderBy: { score: "desc" }
    });
    res.json({ matches });
  } catch (error) {
    next(error);
  }
});

export default router;
