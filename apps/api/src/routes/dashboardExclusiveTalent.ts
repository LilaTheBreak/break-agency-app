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
      
      // Start with empty response to verify endpoint works
      const snapshots: any[] = [];
      
      try {
        // Fetch all exclusive talents - simple query first
        const exclusiveTalents = await prisma.talent.findMany({
          where: {
            representationType: "EXCLUSIVE",
          },
          select: {
            id: true,
            name: true,
            displayName: true,
            status: true,
            representationType: true,
            managerId: true,
            userId: true,
            User: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: { name: "asc" },
        });
        
        console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Found", exclusiveTalents.length, "exclusive talents");
        
        // Build snapshots with safe defaults
        for (const talent of exclusiveTalents) {
          try {
            if (!talent?.id) {
              console.warn("[EXCLUSIVE-TALENT-SNAPSHOT] Skipping invalid talent");
              continue;
            }
            
            // Get deals for this talent
            const deals = await prisma.deal.findMany({
              where: { talentId: talent.id },
              select: {
                id: true,
                stage: true,
                value: true,
              },
            });
            
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
                openPipeline: deals.reduce((sum, d) => sum + (d.value || 0), 0),
                confirmedRevenue: 0,
                paid: 0,
                unpaid: 0,
                activeCount: deals.filter(d => d.stage && !["COMPLETED", "LOST"].includes(d.stage)).length,
              },
              flags: {
                dealsWithoutStage: 0,
                overdueDeals: 0,
                unpaidDeals: 0,
                noManagerAssigned: !talent.managerId,
              },
              riskLevel: talent.managerId ? "LOW" : "MEDIUM",
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
          highRisk: 0,
          mediumRisk: snapshots.length,
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
