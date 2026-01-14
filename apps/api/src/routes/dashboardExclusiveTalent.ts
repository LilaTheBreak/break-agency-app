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
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { isAdminRequest } from '../lib/auditLogger';
import { logError } from '../lib/logger';

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
                Payment: {
                  select: {
                    id: true,
                    amount: true,
                    status: true,
                    actualPaymentDate: true,
                  },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        });
        
        console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Found", exclusiveTalents.length, "exclusive talents");
        
        // Fetch manager info for talents that have managers
        const managerIds = Array.from(
          new Set(exclusiveTalents.map(t => t.managerId).filter((id): id is string => id !== null && id !== undefined))
        );
        const managers = managerIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: managerIds } },
              select: { id: true, name: true },
            })
          : [];
        
        const managerMap = new Map(managers.map(m => [m.id, m.name]));
        
        console.log("[EXCLUSIVE-TALENT-SNAPSHOT] Fetched", managers.length, "manager records");
        
        // Build snapshots with complete financial data
        for (const talent of exclusiveTalents) {
          try {
            if (!talent?.id) {
              console.warn("[EXCLUSIVE-TALENT-SNAPSHOT] Skipping invalid talent");
              continue;
            }
            
            // Calculate deal metrics based on actual DealStage enum values
            const deals = talent.Deal || [];
            
            // Active deal stages (deals in active negotiation/execution)
            const pipelineStages = ["NEW_LEAD", "NEGOTIATION", "CONTRACT_SENT"];
            const confirmedStages = ["CONTRACT_SIGNED", "DELIVERABLES_IN_PROGRESS", "PAYMENT_PENDING", "PAYMENT_RECEIVED"];
            const activeStages = [...pipelineStages, ...confirmedStages];
            
            // Calculate pipeline (deals in discussion, not yet signed)
            const pipelineDeals = deals.filter(d => pipelineStages.includes(d.stage || ""));
            const openPipeline = pipelineDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            
            // Calculate confirmed revenue (deals signed or further along)
            const confirmedDeals = deals.filter(d => confirmedStages.includes(d.stage || ""));
            const confirmedRevenue = confirmedDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            
            // Calculate paid and unpaid amounts from Payment records on confirmed deals
            let paidAmount = 0;
            let unpaidAmount = 0;
            
            for (const deal of confirmedDeals) {
              const dealPayments = deal.Payment || [];
              const dealPaidAmount = dealPayments
                .filter(p => p.status === "PAID")
                .reduce((sum, p) => sum + (p.amount || 0), 0);
              
              paidAmount += dealPaidAmount;
              
              // Unpaid for this deal = deal value - paid amount
              const dealUnpaidAmount = (deal.value || 0) - dealPaidAmount;
              if (dealUnpaidAmount > 0) {
                unpaidAmount += dealUnpaidAmount;
              }
            }
            
            // Calculate flags
            // 1. Deals without stage (NEW_LEAD or null stage - shouldn't happen but check)
            const dealsWithoutStage = deals.filter(d => !d.stage || d.stage === "NEW_LEAD").length;
            
            // 2. Overdue deals (endDate passed and not completed/lost)
            const overdueDeals = deals.filter(d => {
              if (!d.endDate) return false;
              const isActive = !["COMPLETED", "LOST"].includes(d.stage || "");
              const isPast = new Date(d.endDate) < new Date();
              return isActive && isPast;
            }).length;
            
            // 3. Unpaid deals (confirmed deals with unpaid amount)
            const unpaidDealsCount = confirmedDeals.filter(d => {
              const dealPayments = d.Payment || [];
              const dealPaidAmount = dealPayments
                .filter(p => p.status === "PAID")
                .reduce((sum, p) => sum + (p.amount || 0), 0);
              return (d.value || 0) - dealPaidAmount > 0;
            }).length;
            
            // 4. No manager assigned
            const noManagerAssigned = !talent.managerId;
            
            // Calculate risk level with weighted severity
            // HIGH: ≥1 overdue deal OR unpaid amount > £5000 OR no active deals
            // MEDIUM: pipeline exists but no confirmed deals OR no manager assigned
            // LOW: confirmed deals paid OR no red flags
            
            const hasActiveDealValue = activeStages.some(stage => 
              deals.filter(d => d.stage === stage).some(d => (d.value || 0) > 0)
            );
            
            let riskLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
            
            if (overdueDeals > 0 || unpaidAmount > 5000 || (confirmedDeals.length > 0 && !hasActiveDealValue)) {
              riskLevel = "HIGH";
            } else if ((openPipeline > 0 && confirmedRevenue === 0) || noManagerAssigned) {
              riskLevel = "MEDIUM";
            }
            
            if (riskLevel === "HIGH") totalHighRisk++;
            if (riskLevel === "MEDIUM") totalMediumRisk++;
            
            snapshots.push({
              id: talent.id,
              name: talent.name || "Unknown",
              displayName: talent.displayName || null,
              status: talent.status || "ACTIVE",
              representationType: talent.representationType || "EXCLUSIVE",
              managerId: talent.managerId || null,
              managerName: talent.managerId ? managerMap.get(talent.managerId) || null : null,
              creatorEmail: talent.User?.email || null,
              deals: {
                openPipeline,
                confirmedRevenue,
                paid: paidAmount,
                unpaid: unpaidAmount,
                activeCount: deals.filter(d => activeStages.includes(d.stage || "")).length,
              },
              flags: {
                dealsWithoutStage,
                overdueDeals,
                unpaidDeals: unpaidDealsCount,
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
