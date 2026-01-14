import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from "zod";

const router = Router();

// Audit logging helper
async function logQueueAudit(
  userId: string,
  action: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: "QUEUE",
        entityId: entityId || "system",
        metadata: metadata || {},
      },
    });
  } catch (err) {
    console.error("[AUDIT] Failed to log queue action:", err);
  }
}

// GET /api/queues - Get queue items by status (production-ready)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    
    // For now, return empty array until queue system is fully implemented
    // This prevents 404 errors in the frontend
    if (status === "pending") {
      // Could fetch from deliverables, content approvals, etc.
      const pendingContent = await prisma.deliverable.findMany({
        where: {
          approvedAt: null,
          dueAt: { not: null }
        },
        select: {
          id: true,
          title: true,
          description: true,
          deliverableType: true,
          dueAt: true,
          createdAt: true
        },
        orderBy: { dueAt: "asc" },
        take: 10
      });
      
      return res.json(pendingContent);
    }
    
    // Default: return empty array for any other status (legitimate empty state)
    return res.json([]);
  } catch (err) {
    // Phase 4: Fail loudly - no empty arrays on error
    console.error("Error fetching queue items:", err);
    return res.status(500).json({ 
      error: "Failed to fetch queue items",
      message: err instanceof Error ? err.message : "Unknown error"
    });
  }
});

// GET /api/queues/all - Get all queue items that need attention
router.get("/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

    // Log queue view
    await logQueueAudit(userId, "QUEUE_VIEWED");

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
      success: true,
      items: queueItems,
      summary: {
        total: queueItems.length,
        onboarding: pendingOnboarding.length,
        content: pendingContent.length,
        contracts: pendingContracts.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[QUEUES] Error:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to fetch queue items",
      errorType: "DATABASE_ERROR"
    });
  }
});

// POST /api/queues/:id/complete - Mark a queue item as complete
router.post("/:id/complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

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
        await logQueueAudit(userId, "QUEUE_ITEM_COMPLETED", id, { 
          type: "onboarding",
          action: "approved" 
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
        await logQueueAudit(userId, "QUEUE_ITEM_COMPLETED", id, { 
          type: "content",
          action: "approved" 
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
        await logQueueAudit(userId, "QUEUE_ITEM_COMPLETED", id, { 
          type: "contract",
          action: "signed" 
        });
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: "Invalid type",
          errorType: "INVALID_TYPE" 
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[QUEUES] Complete error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to complete queue item",
      errorType: "DATABASE_ERROR" 
    });
  }
});

// POST /api/queues/:id/delete - Delete/reject a queue item
router.post("/:id/delete", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

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
        await logQueueAudit(userId, "QUEUE_ITEM_DELETED", id, { 
          type: "onboarding",
          reason: reason || "Application rejected" 
        });
        break;

      case "content":
        const existing = await prisma.deliverable.findUnique({ where: { id } });
        await prisma.deliverable.update({
          where: { id },
          data: {
            description: `${reason ? `REJECTED: ${reason}. ` : "REJECTED. "}${existing?.description || ""}`,
            updatedAt: new Date()
          }
        });
        await logQueueAudit(userId, "QUEUE_ITEM_DELETED", id, { 
          type: "content",
          reason: reason || "Content rejected" 
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
        await logQueueAudit(userId, "QUEUE_ITEM_DELETED", id, { 
          type: "contract",
          reason: reason || "Contract rejected" 
        });
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: "Invalid type",
          errorType: "INVALID_TYPE" 
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[QUEUES] Delete error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete queue item",
      errorType: "DATABASE_ERROR" 
    });
  }
});

// ============================================================================
// INTERNAL QUEUE TASKS - PERSISTENT ADMIN TASKS
// ============================================================================

const InternalTaskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  dueDate: z.string().optional(),
  assignedToUserId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const InternalTaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  dueDate: z.string().optional(),
  assignedToUserId: z.string().nullable().optional(),
  status: z.enum(["pending", "completed"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/queues/internal-tasks - Get all internal tasks
router.get("/internal-tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

    const tasks = await prisma.internalQueueTask.findMany({
      where: {
        status: "pending"
      },
      include: {
        CreatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        AssignedToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" }
      ]
    });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("[QUEUES] Internal tasks fetch error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch internal tasks",
      errorType: "DATABASE_ERROR" 
    });
  }
});

// POST /api/queues/internal-tasks - Create internal task
router.post("/internal-tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

    const parsed = InternalTaskCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid payload",
        errorType: "VALIDATION_ERROR",
        details: parsed.error.issues 
      });
    }

    const taskData = parsed.data;
    const task = await prisma.internalQueueTask.create({
      data: {
        id: crypto.randomUUID(),
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        assignedToUserId: taskData.assignedToUserId,
        createdByUserId: userId,
        metadata: taskData.metadata as any || {},
        updatedAt: new Date()
      },
      include: {
        CreatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        AssignedToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    await logQueueAudit(userId, "INTERNAL_TASK_CREATED", task.id, {
      title: task.title,
      priority: task.priority,
      assignedTo: task.assignedToUserId
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error("[QUEUES] Internal task creation error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create internal task",
      errorType: "DATABASE_ERROR" 
    });
  }
});

// PATCH /api/queues/internal-tasks/:id - Update internal task
router.patch("/internal-tasks/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

    const parsed = InternalTaskUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid payload",
        errorType: "VALIDATION_ERROR",
        details: parsed.error.issues 
      });
    }

    const updateData = parsed.data;
    const dataToUpdate: any = {
      updatedAt: new Date()
    };

    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.priority !== undefined) dataToUpdate.priority = updateData.priority;
    if (updateData.dueDate !== undefined) dataToUpdate.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.assignedToUserId !== undefined) dataToUpdate.assignedToUserId = updateData.assignedToUserId;
    if (updateData.metadata !== undefined) dataToUpdate.metadata = updateData.metadata as any;
    
    if (updateData.status === "completed") {
      dataToUpdate.status = "completed";
      dataToUpdate.completedAt = new Date();
    } else if (updateData.status === "pending") {
      dataToUpdate.status = "pending";
      dataToUpdate.completedAt = null;
    }

    const task = await prisma.internalQueueTask.update({
      where: { id },
      data: dataToUpdate,
      include: {
        CreatedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        AssignedToUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const auditAction = updateData.status === "completed" 
      ? "INTERNAL_TASK_COMPLETED" 
      : "INTERNAL_TASK_UPDATED";
    
    await logQueueAudit(userId, auditAction, task.id, {
      title: task.title,
      changes: updateData
    });

    res.json({ success: true, task });
  } catch (error) {
    console.error("[QUEUES] Internal task update error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update internal task",
      errorType: "DATABASE_ERROR" 
    });
  }
});

// DELETE /api/queues/internal-tasks/:id - Delete internal task
router.delete("/internal-tasks/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Unauthorized",
        errorType: "AUTH_REQUIRED" 
      });
    }

    const task = await prisma.internalQueueTask.findUnique({ where: { id } });
    
    await prisma.internalQueueTask.delete({
      where: { id }
    });

    await logQueueAudit(userId, "INTERNAL_TASK_DELETED", id, {
      title: task?.title
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[QUEUES] Internal task deletion error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete internal task",
      errorType: "DATABASE_ERROR" 
    });
  }
});

export default router;
