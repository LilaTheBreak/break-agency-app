import { Router } from "express";
import prisma from '../lib/prisma';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(requireRole(["admin", "founder"]));

router.get("/payouts/summary", async (_req, res) => {
  const [totals, latestPayouts, balances] = await Promise.all([
    prisma.payout.groupBy({
      by: ["status"],
      _sum: { amount: true }
    }),
    prisma.payout.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.creatorBalance.findMany({ orderBy: { available: "desc" }, take: 5 })
  ]);

  const summary = totals.reduce(
    (acc, group) => {
      acc[group.status] = group._sum.amount || 0;
      return acc;
    },
    {} as Record<string, number>
  );

  res.json({ summary, latestPayouts, balances });
});

export default router;
