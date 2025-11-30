import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/auth.js";
import { getDealsWithFilters } from "../services/dealThreadService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.user!;
    const { talentId, brandId, stage, status } = req.query;
    const threads = await getDealsWithFilters(user, {
      talentId: typeof talentId === "string" ? talentId : undefined,
      brandId: typeof brandId === "string" ? brandId : undefined,
      stage: typeof stage === "string" ? stage : undefined,
      status: typeof status === "string" ? status : undefined
    });
    res.json({ threads });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/assign", requireAdmin, async (req, res, next) => {
  try {
    const { talentIds, agentIds } = req.body ?? {};
    const updated = await prisma.dealThread.update({
      where: { id: req.params.id },
      data: {
        talentIds: Array.isArray(talentIds) ? talentIds : undefined,
        agentIds: Array.isArray(agentIds) ? agentIds : undefined
      }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
