/**
 * Exclusive Talent Snapshot Endpoint
 *
 * GET /api/admin/dashboard/exclusive-talent-snapshot
 *
 * Returns an aggregate snapshot of all exclusive talents with:
 * - Deal pipeline, revenue, and payment status
 * - Risk flags (deals without stage, overdue deals, unpaid deals, no manager)
 * - Admin and manager information
 */

import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { isAdminRequest } from "../lib/auditLogger.js";
import { logError } from "../lib/logger.js";

const router = Router();

interface TalentSnapshot {
  id: string;
  name: string;
  displayName: string | null;
  status: string | null;
  representationType: string | null;
  managerId: string | null;
  managerName: string | null;
  creatorEmail: string | null;
  deals: {
    openPipeline: number;
    confirmedRevenue: number;
    paid: number;
    unpaid: number;
    activeCount: number;
  };
  flags: {
    dealsWithoutStage: number;
    overdueDeals: number;
    unpaidDeals: number;
    noManagerAssigned: boolean;
  };
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * GET /api/admin/dashboard/exclusive-talent-snapshot
 *
 * Returns snapshot of all exclusive talents
 * Admin-only access
 */
router.get(
  "/exclusive-talent-snapshot",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // Verify admin access
      if (!isAdminRequest(req)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Fetch all exclusive talents with their creator info
      const exclusiveTalents = await prisma.talent.findMany({
        where: {
          representationType: "EXCLUSIVE",
        },
        include: {
          User: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      // For each talent, aggregate deal data
      const snapshots: TalentSnapshot[] = [];

      for (const talent of exclusiveTalents) {
        // Fetch all deals for this talent
        const deals = await prisma.deal.findMany({
          where: { talentId: talent.id },
          select: {
            id: true,
            stage: true,
            value: true,
            expectedClose: true,
            paymentStatus: true,
          },
        });

        // Calculate aggregates
        const now = new Date();
        const openPipeline = deals
          .filter(
            (d) =>
              d.stage && !["COMPLETED", "LOST", "DECLINED"].includes(d.stage)
          )
          .reduce((sum, d) => sum + (d.value || 0), 0);

        const confirmedRevenue = deals
          .filter(
            (d) =>
              d.stage &&
              [
                "CONTRACT_SIGNED",
                "DELIVERABLES_IN_PROGRESS",
                "PAYMENT_PENDING",
              ].includes(d.stage)
          )
          .reduce((sum, d) => sum + (d.value || 0), 0);

        const paid = deals
          .filter(
            (d) =>
              d.stage && ["PAYMENT_RECEIVED", "COMPLETED"].includes(d.stage)
          )
          .reduce((sum, d) => sum + (d.value || 0), 0);

        const unpaid = confirmedRevenue - paid;

        // Count risk flags
        const dealsWithoutStage = deals.filter((d) => !d.stage).length;
        const overdueDeals = deals.filter(
          (d) =>
            d.expectedClose && new Date(d.expectedClose) < now && d.stage
        ).length;
        const unpaidDeals = deals.filter(
          (d) =>
            d.stage &&
            ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING"]
              .includes(d.stage) &&
            (!d.paymentStatus || d.paymentStatus !== "PAID")
        ).length;

        const noManagerAssigned = !talent.managerId;

        // Determine risk level
        const flagCount = (dealsWithoutStage > 0 ? 1 : 0) +
          (overdueDeals > 0 ? 1 : 0) +
          (unpaidDeals > 0 ? 1 : 0) +
          (noManagerAssigned ? 1 : 0);

        let riskLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
        if (flagCount >= 3) riskLevel = "HIGH";
        else if (flagCount >= 1) riskLevel = "MEDIUM";

        snapshots.push({
          id: talent.id,
          name: talent.name,
          displayName: talent.displayName,
          status: talent.status,
          representationType: talent.representationType,
          managerId: talent.managerId,
          managerName: talent.managerId ? "(to be loaded)" : null, // Will add manager lookup
          creatorEmail: talent.User?.email || null,
          deals: {
            openPipeline,
            confirmedRevenue,
            paid,
            unpaid,
            activeCount: deals.filter(
              (d) => d.stage && !["COMPLETED", "LOST", "DECLINED"].includes(d.stage)
            ).length,
          },
          flags: {
            dealsWithoutStage,
            overdueDeals,
            unpaidDeals,
            noManagerAssigned,
          },
          riskLevel,
        });
      }

      // Load manager names for talents that have managers
      for (const snapshot of snapshots) {
        if (snapshot.managerId) {
          const manager = await prisma.user.findUnique({
            where: { id: snapshot.managerId },
            select: { name: true },
          });
          snapshot.managerName = manager?.name || "Unknown";
        }
      }

      // Return in descending risk order (HIGH first, then MEDIUM, then LOW)
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      snapshots.sort(
        (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
      );

      return res.json({
        talents: snapshots,
        meta: {
          totalExclusiveTalents: snapshots.length,
          highRisk: snapshots.filter((s) => s.riskLevel === "HIGH").length,
          mediumRisk: snapshots.filter((s) => s.riskLevel === "MEDIUM").length,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Error:", error);
      console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Stack:", error instanceof Error ? error.stack : "No stack available");
      logError(
        "[/api/admin/dashboard/exclusive-talent-snapshot] Failed",
        error,
        { userId: (req as any).user?.id }
      );
      return res.status(500).json({
        error: "Failed to fetch exclusive talent snapshot",
        errorCode: "SNAPSHOT_FETCH_FAILED",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }
);

export default router;
