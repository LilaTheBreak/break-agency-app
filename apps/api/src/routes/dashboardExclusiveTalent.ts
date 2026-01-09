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
      console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Starting snapshot fetch");
      
      // Verify admin access
      if (!isAdminRequest(req)) {
        console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Non-admin user, rejecting");
        return res.status(403).json({ error: "Admin access required" });
      }

      console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Admin verified, fetching talents...");
      
      const snapshots: any[] = [];
      let totalHighRisk = 0;
      let totalMediumRisk = 0;
      
      try {
        // Fetch all exclusive talents with related data
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
            Deal: {
              select: {
                id: true,
                stage: true,
                value: true,
                endDate: true,
                createdAt: true,
              },
            },
            Payment: {
              select: {
                id: true,
                amount: true,
                status: true,
              },
            },
            Payout: {
              select: {
                id: true,
                amount: true,
                status: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });
        
        console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Found", exclusiveTalents.length, "exclusive talents");
        
        // Build snapshots with complete financial data
        for (const talent of exclusiveTalents) {
          try {
            if (!talent?.id) {
              console.warn("[EXCLUSIVE-TALENT-SNAPSHOT] Skipping invalid talent");
              continue;
            }
            
            // Calculate deal metrics
            const deals = talent.Deal || [];
            const activeDealStages = ["PITCH", "NEGOTIATION", "AWAITING_SIGNATURE", "ACTIVE"];
            const activeDealStagesWithValue = ["PITCH", "NEGOTIATION"];
            
            const openPipelineDeals = deals.filter(d => activeDealStagesWithValue.includes(d.stage || ""));
            const confirmedDeals = deals.filter(d => ["AWAITING_SIGNATURE", "ACTIVE"].includes(d.stage || ""));
            const completedDeals = deals.filter(d => d.stage === "COMPLETED");
            
            const openPipeline = openPipelineDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const confirmedRevenue = confirmedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            
            // Calculate payment metrics
            const paidAmount = (talent.Payout || [])
              .filter(p => p.status === "PAID")
              .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const unpaidAmount = (talent.Payout || [])
              .filter(p => ["PENDING", "PROCESSING"].includes(p.status || "PENDING"))
              .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            // Calculate flags
            const dealsWithoutStage = deals.filter(d => !d.stage).length;
            const overdueDeals = deals.filter(d => {
              if (!d.endDate) return false;
              return new Date(d.endDate) < new Date() && !["COMPLETED", "LOST"].includes(d.stage || "");
            }).length;
            const unpaidDeals = deals.filter(d => d.stage === "COMPLETED" && unpaidAmount > 0).length;
            const noManagerAssigned = !talent.managerId;
            
            // Calculate risk level
            const flagCount = (dealsWithoutStage > 0 ? 1 : 0) + 
                            (overdueDeals > 0 ? 1 : 0) + 
                            (unpaidDeals > 0 ? 1 : 0) + 
                            (noManagerAssigned ? 1 : 0);
            
            let riskLevel = "LOW";
            if (flagCount >= 3) riskLevel = "HIGH";
            else if (flagCount >= 1) riskLevel = "MEDIUM";
            
            if (riskLevel === "HIGH") totalHighRisk++;
            if (riskLevel === "MEDIUM") totalMediumRisk++;
            
            snapshots.push({
              id: talent.id,
              name: talent.name || "Unknown",
              displayName: talent.displayName || null,
              status: talent.status || "ACTIVE",
              representationType: talent.representationType || "EXCLUSIVE",
              managerId: talent.managerId || null,
              managerName: talent.managerId ? "TBD" : null,
              creatorEmail: talent.User?.email || null,
              deals: {
                openPipeline,
                confirmedRevenue,
                paid: paidAmount,
                unpaid: unpaidAmount,
                activeCount: deals.filter(d => activeDealStages.includes(d.stage || "")).length,
              },
              flags: {
                dealsWithoutStage,
                overdueDeals,
                unpaidDeals,
                noManagerAssigned,
              },
              riskLevel,
            });
          } catch (talentError) {
            console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Error processing talent:", talentError);
            // Continue with next talent
          }
        }
        
        console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Built", snapshots.length, "snapshots");
        
      } catch (queryError) {
        console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Query error:", queryError);
        throw queryError;
      }
      
      // Return response
      console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Returning response");
      const response = {
        talents: snapshots,
        meta: {
          totalExclusiveTalents: snapshots.length,
          highRisk: totalHighRisk,
          mediumRisk: totalMediumRisk,
          generatedAt: new Date().toISOString(),
        },
      };
      
      console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Response object ready, sending...");
      return res.status(200).json(response);
      
    } catch (error) {
      console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Handler error:", error);
      console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Error type:", error instanceof Error ? "Error" : typeof error);
      console.error("[EXCLUSIVE-TALENT-SNAPSHOT] Error message:", error instanceof Error ? error.message : String(error));
      
      logError(
        "[/api/admin/dashboard/exclusive-talent-snapshot] Failed",
        error,
        { userId: (req as any).user?.id }
      );
      
      return res.status(500).json({
        error: "SNAPSHOT_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
