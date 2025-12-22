import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/crm-tasks
 * List all CRM tasks with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, priority, owner, brandId, campaignId } = req.query;

    const where: any = {};
    if (status && typeof status === "string") where.status = status;
    if (priority && typeof priority === "string") where.priority = priority;
    if (owner && typeof owner === "string") where.owner = owner;
    if (brandId && typeof brandId === "string") where.brandId = brandId;
    if (campaignId && typeof campaignId === "string") where.campaignId = campaignId;

    const tasks = await prisma.crmTask.findMany({
      where,
      orderBy: [
        { dueDate: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true
          }
        },
        Campaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        User: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return res.json(tasks);
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

    const task = await prisma.crmTask.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true
          }
        },
        Campaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        User: {
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
      status,
      priority,
      dueDate,
      owner,
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
        title: title.trim(),
        status: status || "Pending",
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        owner: owner || null,
        brandId: brandId || null,
        dealId: dealId || null,
        campaignId: campaignId || null,
        eventId: eventId || null,
        contractId: contractId || null,
        createdBy: req.user?.id || null
      },
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true
          }
        },
        Campaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        User: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Error creating CRM task:", error);
    return res.status(500).json({ error: "Failed to create task" });
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
      status,
      priority,
      dueDate,
      owner,
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
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (owner !== undefined) updateData.owner = owner || null;
    if (brandId !== undefined) updateData.brandId = brandId || null;
    if (dealId !== undefined) updateData.dealId = dealId || null;
    if (campaignId !== undefined) updateData.campaignId = campaignId || null;
    if (eventId !== undefined) updateData.eventId = eventId || null;
    if (contractId !== undefined) updateData.contractId = contractId || null;

    const task = await prisma.crmTask.update({
      where: { id },
      data: updateData,
      include: {
        Brand: {
          select: {
            id: true,
            brandName: true
          }
        },
        Campaign: {
          select: {
            id: true,
            campaignName: true
          }
        },
        User: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

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
