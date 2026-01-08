// @ts-nocheck
import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

/**
 * GET /api/dashboard/revenue-breakdown
 *
 * Mounted under /api/dashboard in routes/index.ts
 */
router.get("/revenue-breakdown", requireAuth, async (req: Request, res: Response) => {
  try {
    // 1. Revenue YTD
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const revenueYTD = (await (prisma.payment.aggregate as any)({
      _sum: { amount: true },
      where: {
        status: "completed",
        createdAt: { gte: startOfYear },
      } as any,
    }) as any);

    // 2. Revenue per talent
    const revenueByTalent = await prisma.payment.groupBy({
      by: ["userId"],
      _sum: { amount: true },
      where: { status: "completed" },
    });

    // 3. Latest 12 months revenue (for charts)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const revenueByMonthRaw = await prisma.payment.findMany({
      where: {
        status: "completed",
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Format monthly totals
    const revenueByMonth: Record<string, number> = {};
    for (const p of revenueByMonthRaw) {
      const monthKey = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] ?? 0) + p.amount;
    }

    return res.json({
      ok: true,
      data: {
        revenueYTD: revenueYTD._sum.amount ?? 0,
        revenueByTalent,
        revenueByMonth,
      },
    });
  } catch (err) {
    console.error("REVENUE BREAKDOWN ERROR:", err);
    res.status(500).json({ ok: false, error: "Failed to load revenue breakdown" });
  }
});

export default router;
