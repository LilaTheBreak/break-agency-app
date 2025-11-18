import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/dashboard/:role", async (req: Request, res: Response) => {
  const roleParam = String(req.params.role || "admin").toLowerCase();
  const roleFilter = buildRoleFilter(roleParam);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  const nextWeek = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
  const weekStart = startOfWeek(now);

  const [
    tasksDue,
    dueTomorrow,
    pendingApprovals,
    contentDue,
    briefsReview,
    payoutTotalsRaw,
    invoiceTotalsRaw,
    reconciledThisWeek
  ] = await Promise.all([
    prisma.task.count({
      where: {
        ...roleFilter,
        status: { notIn: ["completed", "canceled"] },
        dueDate: { lte: now }
      }
    }),
    prisma.task.count({
      where: {
        ...roleFilter,
        status: { notIn: ["completed", "canceled"] },
        dueDate: { gt: now, lte: tomorrow }
      }
    }),
    prisma.approval.count({
      where: {
        ...roleFilter,
        status: { in: ["pending", "needs_review", "escalated"] }
      }
    }),
    prisma.deliverable.count({
      where: {
        ...roleFilter,
        status: { notIn: ["approved", "delivered", "archived"] },
        dueDate: { gte: now, lte: nextWeek }
      }
    }),
    prisma.brief.count({
      where: {
        ...roleFilter,
        status: { in: ["needs_review", "pending", "draft"] }
      }
    }),
    prisma.payout.groupBy({
      by: ["status", "currency"],
      _sum: { amount: true },
      _count: { _all: true }
    }),
    prisma.invoice.groupBy({
      by: ["status", "currency"],
      _sum: { amount: true },
      _count: { _all: true }
    }),
    prisma.reconciliation.count({
      where: {
        createdAt: { gte: weekStart }
      }
    })
  ]);

  const payoutTotals = reduceFinancialGroups(payoutTotalsRaw);
  const invoiceTotals = reduceFinancialGroups(invoiceTotalsRaw);

  const summary = {
    tasksDue,
    dueTomorrow,
    pendingApprovals,
    contentDue,
    briefsReview,
    payoutTotals,
    invoiceTotals,
    reconciledThisWeek
  };

  res.json({
    ...summary,
    nextSteps: generateNextSteps(roleParam, summary)
  });
});

export default router;

function buildRoleFilter(role: string) {
  const values = [role, "global", "all"];
  return {
    OR: [
      ...values.map((value) => ({
        role: { equals: value, mode: "insensitive" as const }
      })),
      { role: undefined }
    ]
  };
}

type FinancialGroup = {
  status: string;
  currency: string | null;
  _sum: { amount: number | null };
  _count: { _all: number };
};

function reduceFinancialGroups(groups: FinancialGroup[]) {
  return groups.reduce<Record<string, { amount: number; count: number; currency: string; mixedCurrencies: boolean }>>(
    (acc, group) => {
      const key = group.status || "unknown";
      const existing = acc[key] || {
        amount: 0,
        count: 0,
        currency: group.currency || "usd",
        mixedCurrencies: false
      };
      existing.amount += group._sum.amount ?? 0;
      existing.count += group._count._all ?? 0;
      if (existing.currency && group.currency && existing.currency !== group.currency) {
        existing.mixedCurrencies = true;
      }
      acc[key] = existing;
      return acc;
    },
    {}
  );
}

function startOfWeek(date: Date) {
  const clone = new Date(date);
  clone.setUTCHours(0, 0, 0, 0);
  const day = clone.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start
  clone.setUTCDate(clone.getUTCDate() - diff);
  return clone;
}

function generateNextSteps(
  role: string,
  metrics: {
    tasksDue: number;
    dueTomorrow: number;
    pendingApprovals: number;
    contentDue: number;
    briefsReview: number;
    payoutTotals: Record<string, { amount: number; currency: string; count: number; mixedCurrencies: boolean }>;
    invoiceTotals: Record<string, { amount: number; currency: string; count: number; mixedCurrencies: boolean }>;
    reconciledThisWeek: number;
  }
) {
  const steps: string[] = [];
  if (metrics.tasksDue > 0) {
    steps.push(`Resolve ${metrics.tasksDue} overdue tasks in the ${role} queue.`);
  }
  if (metrics.pendingApprovals > 0) {
    steps.push(`Review ${metrics.pendingApprovals} approvals waiting for sign-off.`);
  }
  const pendingPayouts = metrics.payoutTotals?.pending;
  if (pendingPayouts?.amount) {
    steps.push(`Release ${formatCurrency(pendingPayouts.amount, pendingPayouts.currency)} in pending payouts.`);
  }
  if (metrics.contentDue > 0) {
    steps.push(`Prep deliverables for ${metrics.contentDue} content items due shortly.`);
  }
  if (metrics.briefsReview > 0) {
    steps.push(`Provide feedback on ${metrics.briefsReview} briefs awaiting review.`);
  }
  if (steps.length === 0) {
    steps.push("Pipelines are stable — keep monitoring signals and new briefs.");
  }
  while (steps.length < 3) {
    steps.push(`Check for fresh signals inside the ${role} control room.`);
  }
  return steps.slice(0, 3);
}

function formatCurrency(amount: number, currency = "usd") {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}
