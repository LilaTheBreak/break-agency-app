import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Note: brandRelationship and brandEvent models don't exist
// Stubbing out to prevent errors - this feature is not fully implemented
router.get("/", requireAuth, async (req, res) => {
  // Return empty array for now
  res.json({ brands: [] });

  // Original implementation (commented out - models don't exist):
  // const brands = await prisma.brandRelationship.findMany({
  //   where: { userId: req.user!.id },
  //   orderBy: { affinityScore: "desc" }
  // });
  // res.json({ brands });
});

router.get("/:id", requireAuth, async (req, res) => {
  // Return stub data
  res.json({ 
    brand: null,
    events: []
  });

  // Original implementation (commented out - models don't exist):
  // const brand = await prisma.brandRelationship.findUnique({
  //   where: { id: req.params.id }
  // });
  // const events = await prisma.brandEvent.findMany({
  //   where: { brandId: req.params.id },
  //   orderBy: { createdAt: "desc" }
  // });
  // res.json({ brand, events });
});

export default router;
