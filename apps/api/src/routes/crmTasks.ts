import { Router, type Request, type Response } from "express";
import { createId as cuid } from "@paralleldrive/cuid2";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { createTaskNotifications, canViewTask, buildTaskVisibilityWhere } from "../services/taskNotifications.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/crm-tasks/users
 * Get all users for @mentions and assignments
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        onboarding_status: {
          not: "archived"
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true
      },
      orderBy: {
        name: "asc"
      }
    });

    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * GET /api/crm-tasks/talents
 * Get all talents/creators for task relations
 */
router.get("/talents", async (req: Request, res: Response) => {
  try {
    const talents = await prisma.talent.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        User: {
          select: {
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return res.json(talents);
  } catch (error) {
    console.error("Error fetching talents:", error);
    return res.status(500).json({ error: "Failed to fetch talents" });
  }
});

/**
 * GET /api/crm-tasks
 * List all CRM tasks with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, priority, owner, brandId, campaignId } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role || "";

    const where: any = {};
    if (status && typeof status === "string") where.status = status;
    if (priority && typeof priority === "string") where.priority = priority;
    if (owner && typeof owner === "string") where.owner = owner;
    if (brandId && typeof brandId === "string") where.brandId = brandId;
    if (campaignId && typeof campaignId === "string") where.campaignId = campaignId;
    
    // Apply visibility filtering based on user role
    const visibilityWhere = buildTaskVisibilityWhere(userId!, userRole);
    Object.assign(where, visibilityWhere);

    const tasks = await prisma.crmTask.findMany({
      where,
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true
          }
        },
        CrmCampaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        Owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        CreatedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    // Additional filter for mentions (JSON field - can't filter in Prisma)
    const filteredTasks = tasks.filter(task => 
      canViewTask(task, userId!, userRole)
    );

    return res.json(filteredTasks);
  } catch (error) {
    console.error("Error fetching CRM tasks:", error);
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

/**
 * GET /api/crm-tasks/:id
 * Get a single CRM task by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role || "";

    const task = await prisma.crmTask.findUnique({
      where: { id },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true
          }
        },
        CrmCampaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        Owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        CreatedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    // Check if user has permission to view this task
    if (!canViewTask(task, userId!, userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.json(task);
  } catch (error) {
    console.error("Error fetching CRM task:", error);
    return res.status(500).json({ error: "Failed to fetch task" });
  }
});

/**
 * POST /api/crm-tasks
 * Create a new CRM task
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      owner,
      ownerId,
      assignedUserIds,
      mentions,
      relatedBrands,
      relatedCreators,
      relatedUsers,
      relatedDeals,
      relatedCampaigns,
      relatedEvents,
      relatedContracts,
      brandId,
      dealId,
      campaignId,
      eventId,
      contractId
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }

    const task = await prisma.crmTask.create({
      data: {
        id: cuid(),
        title: title.trim(),
        description: description || null,
        status: status || "Pending",
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        owner: owner || null,
        ownerId: ownerId || req.user?.id || null,
        assignedUserIds: assignedUserIds || [],
        mentions: mentions || [],
        relatedBrands: relatedBrands || [],
        relatedCreators: relatedCreators || [],
        relatedUsers: relatedUsers || [],
        relatedDeals: relatedDeals || [],
        relatedCampaigns: relatedCampaigns || [],
        relatedEvents: relatedEvents || [],
        relatedContracts: relatedContracts || [],
        brandId: brandId || null,
        dealId: dealId || null,
        campaignId: campaignId || null,
        eventId: eventId || null,
        contractId: contractId || null,
        createdBy: req.user?.id || null,
        updatedAt: new Date()
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true
          }
        },
        CrmCampaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        Owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        CreatedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    // Create notifications for mentions and assignments
    await createTaskNotifications(task, "created");

    return res.status(201).json(task);
  } catch (error: any) {
    console.error("[CRM Tasks] Error creating task:", {
      error: error.message,
      code: error.code,
      meta: error.meta,
      userId: req.user?.id,
      requestBody: req.body
    });
    
    // Return specific error messages for common issues
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: "Invalid reference: One or more related entities (brand, campaign, etc.) do not exist" 
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to create task",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/crm-tasks/:id
 * Update an existing CRM task
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt,
      owner,
      ownerId,
      assignedUserIds,
      mentions,
      relatedBrands,
      relatedCreators,
      relatedUsers,
      relatedDeals,
      relatedCampaigns,
      relatedEvents,
      relatedContracts,
      brandId,
      dealId,
      campaignId,
      eventId,
      contractId
    } = req.body;

    const existing = await prisma.crmTask.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updateData: any = {};
    if (title !== undefined) {
      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Task title cannot be empty" });
      }
      updateData.title = title.trim();
    }
    if (description !== undefined) updateData.description = description || null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (owner !== undefined) updateData.owner = owner || null;
    if (ownerId !== undefined) updateData.ownerId = ownerId || null;
    if (assignedUserIds !== undefined) updateData.assignedUserIds = assignedUserIds;
    if (mentions !== undefined) updateData.mentions = mentions;
    if (relatedBrands !== undefined) updateData.relatedBrands = relatedBrands;
    if (relatedCreators !== undefined) updateData.relatedCreators = relatedCreators;
    if (relatedUsers !== undefined) updateData.relatedUsers = relatedUsers;
    if (relatedDeals !== undefined) updateData.relatedDeals = relatedDeals;
    if (relatedCampaigns !== undefined) updateData.relatedCampaigns = relatedCampaigns;
    if (relatedEvents !== undefined) updateData.relatedEvents = relatedEvents;
    if (relatedContracts !== undefined) updateData.relatedContracts = relatedContracts;
    if (brandId !== undefined) updateData.brandId = brandId || null;
    if (dealId !== undefined) updateData.dealId = dealId || null;
    if (campaignId !== undefined) updateData.campaignId = campaignId || null;
    if (eventId !== undefined) updateData.eventId = eventId || null;
    if (contractId !== undefined) updateData.contractId = contractId || null;

    const task = await prisma.crmTask.update({
      where: { id },
      data: updateData,
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true
          }
        },
        CrmCampaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        Owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        CreatedByUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    // Create notifications for new mentions and assignments
    await createTaskNotifications(task, "updated");

    return res.json(task);
  } catch (error) {
    console.error("Error updating CRM task:", error);
    return res.status(500).json({ error: "Failed to update task" });
  }
});

/**
 * DELETE /api/crm-tasks/:id
 * Delete a CRM task
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role || "";
    
    // Only Admins and SuperAdmins can delete tasks
    if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
      return res.status(403).json({ error: "Only Admins can delete tasks" });
    }

    const existing = await prisma.crmTask.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    await prisma.crmTask.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting CRM task:", error);
    return res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
