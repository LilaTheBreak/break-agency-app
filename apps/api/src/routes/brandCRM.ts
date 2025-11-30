import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const brands = await prisma.brandRelationship.findMany({
    where: { userId: req.user!.id },
    orderBy: { affinityScore: "desc" }
  });
  res.json({ brands });
});

router.get("/:id", requireAuth, async (req, res) => {
  const brand = await prisma.brandRelationship.findUnique({
    where: { id: req.params.id }
  });
  const events = await prisma.brandEvent.findMany({
    where: { brandId: req.params.id },
    orderBy: { createdAt: "desc" }
  });
  res.json({ brand, events });
});

export default router;
