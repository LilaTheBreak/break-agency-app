import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/queues/all - Get all queue items that need attention
router.get("/all", requireAuth, async (req: Request, res: Response) => {
  try {
    // 1. Onboarding approvals - users pending review
    const pendingOnboarding = await prisma.user.findMany({
      where: {
        onboarding_status: "pending_review"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        bio: true,
        location: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    // 2. Content approvals - deliverables not yet approved
    const pendingContent = await prisma.deliverable.findMany({
      where: {
        approvedAt: null,
        dueAt: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        deliverableType: true,
        dueAt: true,
        createdAt: true,
        Deal: {
          select: {
            brandName: true,
            Brand: {
              select: {
                name: true
              }
            },
            Talent: {
              select: {
                User: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        dueAt: "asc"
      },
      take: 20
    });

    // 3. Contract approvals - deals in CONTRACT_SENT stage
    const pendingContracts = await prisma.deal.findMany({
      where: {
        stage: "CONTRACT_SENT"
      },
      select: {
        id: true,
        brandName: true,
        value: true,
        currency: true,
        contractReceivedAt: true,
        createdAt: true,
        Brand: {
          select: {
            name: true
          }
        },
        Talent: {
          select: {
            User: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    // Format queue items
    const queueItems = [
      // Onboarding requests
      ...pendingOnboarding.map((user) => ({
        id: user.id,
        type: "onboarding",
        title: `${user.name || user.email} - ${user.role}`,
        owner: user.name || user.email,
        status: "Pending review",
        createdAt: user.createdAt,
        metadata: {
          email: user.email,
          role: user.role,
          bio: user.bio,
          location: user.location
        }
      })),

      // Content approvals
      ...pendingContent.map((deliverable) => ({
        id: deliverable.id,
        type: "content",
        title: deliverable.title,
        owner: deliverable.Deal?.Talent?.User?.name || deliverable.Deal?.brandName || "Unknown",
        status: deliverable.dueAt && new Date(deliverable.dueAt) < new Date() 
          ? "Overdue" 
          : "Awaiting approval",
        createdAt: deliverable.createdAt,
        dueAt: deliverable.dueAt,
        metadata: {
          description: deliverable.description,
          type: deliverable.deliverableType,
          brandName: deliverable.Deal?.Brand?.name || deliverable.Deal?.brandName,
          creatorName: deliverable.Deal?.Talent?.User?.name
        }
      })),

      // Contract approvals
      ...pendingContracts.map((deal) => ({
        id: deal.id,
        type: "contract",
        title: `${deal.Brand?.name || deal.brandName || "Brand"} - Contract`,
        owner: deal.Talent?.User?.name || "Unknown",
        status: "Awaiting signature",
        createdAt: deal.createdAt,
        metadata: {
          brandName: deal.Brand?.name || deal.brandName,
          value: deal.value,
          currency: deal.currency,
          contractSentAt: deal.contractReceivedAt
        }
      }))
    ];

    // Sort by creation date (most recent first)
    queueItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      items: queueItems,
      summary: {
        total: queueItems.length,
        onboarding: pendingOnboarding.length,
        content: pendingContent.length,
        contracts: pendingContracts.length
      }
    });
  } catch (error) {
    console.error("[QUEUES] Error:", error);
    res.status(500).json({ error: "Failed to fetch queue items" });
  }
});

// POST /api/queues/:id/complete - Mark a queue item as complete
router.post("/:id/complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    switch (type) {
      case "onboarding":
        await prisma.user.update({
          where: { id },
          data: {
            onboarding_status: "approved",
            onboardingComplete: true,
            updatedAt: new Date()
          }
        });
        break;

      case "content":
        await prisma.deliverable.update({
          where: { id },
          data: {
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        });
        break;

      case "contract":
        await prisma.deal.update({
          where: { id },
          data: {
            stage: "CONTRACT_SIGNED",
            contractSignedAt: new Date(),
            updatedAt: new Date()
          }
        });
        break;

      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[QUEUES] Complete error:", error);
    res.status(500).json({ error: "Failed to complete queue item" });
  }
});

// POST /api/queues/:id/delete - Delete/reject a queue item
router.post("/:id/delete", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, reason } = req.body;

    switch (type) {
      case "onboarding":
        await prisma.user.update({
          where: { id },
          data: {
            onboarding_status: "rejected",
            admin_notes: reason || "Application rejected",
            updatedAt: new Date()
          }
        });
        break;

      case "content":
        // Don't actually delete, just mark as rejected
        await prisma.deliverable.update({
          where: { id },
          data: {
            description: `${reason ? `REJECTED: ${reason}. ` : "REJECTED. "}${await prisma.deliverable.findUnique({ where: { id } }).then(d => d?.description || "")}`,
            updatedAt: new Date()
          }
        });
        break;

      case "contract":
        await prisma.deal.update({
          where: { id },
          data: {
            stage: "NEGOTIATION",
            notes: reason || "Contract rejected",
            updatedAt: new Date()
          }
        });
        break;

      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[QUEUES] Delete error:", error);
    res.status(500).json({ error: "Failed to delete queue item" });
  }
});

export default router;
