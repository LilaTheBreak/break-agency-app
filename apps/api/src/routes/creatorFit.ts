import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:brandName", requireAuth, async (req, res) => {
  const records = await prisma.creatorBrandFit.findMany({
    where: { brandName: req.params.brandName },
    orderBy: { fitScore: "desc" }
  });
  res.json({ creators: records });
});

export default router;
