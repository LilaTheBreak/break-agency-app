import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logAdminActivity } from "../lib/adminActivityLogger.js";

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * GET /api/crm-events
 * List all CRM events with optional filters
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { brandId, status, owner } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId as string;
    if (status) where.status = status as string;
    if (owner) where.owner = owner as string;

    const events = await prisma.crmTask.findMany({
      where,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDateTime: "desc",
      },
    });

    res.json(events || []);
  } catch (error) {
    console.error("Error fetching CRM events:", error);
    // Return empty array instead of 500 - graceful degradation
    res.status(200).json([]);
  }
});

/**
 * GET /api/crm-events/:id
 * Get a single CRM event by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.crmTask.findUnique({
      where: { id },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching CRM event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

/**
 * POST /api/crm-events
 * Create a new CRM event
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      eventName,
      brandId,
      eventType,
      status,
      startDateTime,
      endDateTime,
      location,
      description,
      attendees,
      linkedCampaignIds,
      linkedDealIds,
      linkedTalentIds,
      owner,
    } = req.body;

    if (!eventName || !brandId || !eventType || !startDateTime) {
      return res.status(400).json({
        error: "Missing required fields: eventName, brandId, eventType, startDateTime",
      });
    }

    const event = await prisma.crmTask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventName,
        brandId,
        eventType,
        status: status || "Planned",
        startDateTime: new Date(startDateTime),
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        location: location || null,
        description: description || null,
        attendees: attendees || null,
        linkedCampaignIds: linkedCampaignIds || [],
        linkedDealIds: linkedDealIds || [],
        linkedTalentIds: linkedTalentIds || [],
        owner: owner || null,
        createdBy: req.user!.id,
        notes: [],
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Phase 2: Log to AdminActivity for activity feed
    try {
      await logAdminActivity(req as any, {
        event: "CRM_EVENT_CREATED",
        metadata: { eventId: event.id, eventName: event.eventName, brandId: event.brandId }
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
      // Don't fail the request if logging fails
    }

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating CRM event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

/**
 * PATCH /api/crm-events/:id
 * Update an existing CRM event
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      eventName,
      eventType,
      status,
      startDateTime,
      endDateTime,
      location,
      description,
      attendees,
      linkedCampaignIds,
      linkedDealIds,
      linkedTalentIds,
      owner,
    } = req.body;

    const existing = await prisma.crmTask.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (eventName !== undefined) updateData.eventName = eventName;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (status !== undefined) updateData.status = status;
    if (startDateTime !== undefined) updateData.startDateTime = new Date(startDateTime);
    if (endDateTime !== undefined) updateData.endDateTime = endDateTime ? new Date(endDateTime) : null;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (attendees !== undefined) updateData.attendees = attendees;
    if (linkedCampaignIds !== undefined) updateData.linkedCampaignIds = linkedCampaignIds;
    if (linkedDealIds !== undefined) updateData.linkedDealIds = linkedDealIds;
    if (linkedTalentIds !== undefined) updateData.linkedTalentIds = linkedTalentIds;
    if (owner !== undefined) updateData.owner = owner;

    const updated = await prisma.crmTask.update({
      where: { id },
      data: updateData,
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Phase 2: Log to AdminActivity for activity feed
    try {
      await logAdminActivity(req as any, {
        event: "CRM_EVENT_UPDATED",
        metadata: { eventId: updated.id, eventName: updated.eventName, changes: Object.keys(updateData) }
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
      // Don't fail the request if logging fails
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating CRM event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

/**
 * DELETE /api/crm-events/:id
 * Delete a CRM event
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.crmTask.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }

    await prisma.crmTask.delete({ where: { id } });

    // Phase 2: Log to AdminActivity for activity feed
    try {
      await logAdminActivity(req as any, {
        event: "CRM_EVENT_DELETED",
        metadata: { eventId: existing.id, eventName: existing.eventName }
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
      // Don't fail the request if logging fails
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting CRM event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

/**
 * POST /api/crm-events/:id/notes
 * Add a note to an event
 */
router.post("/:id/notes", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    if (!text || !author) {
      return res.status(400).json({ error: "Missing required fields: text, author" });
    }

    const event = await prisma.crmTask.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const newNote = {
      at: new Date().toISOString(),
      author,
      text,
    };

    const updated = await prisma.crmTask.update({
      where: { id },
      data: {
        notes: [...(Array.isArray(event.notes) ? event.notes : []), newNote],
        updatedAt: new Date(),
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error adding note to event:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
});

/**
 * POST /api/crm-events/batch-import
 * Batch import events from localStorage (migration endpoint)
 */
router.post("/batch-import", async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "events must be an array" });
    }

    const createdEvents: any[] = [];

    for (const event of events) {
      try {
        const created = await prisma.crmEvent.create({
          data: {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventName: event.eventName || "Untitled Event",
            brandId: event.brandId,
            eventType: event.eventType || "Other",
            status: event.status || "Planned",
            startDateTime: new Date(event.startDateTime),
            endDateTime: event.endDateTime ? new Date(event.endDateTime) : null,
            location: event.location || null,
            description: event.description || null,
            attendees: event.attendees || null,
            linkedCampaignIds: event.linkedCampaignIds || [],
            linkedDealIds: event.linkedDealIds || [],
            linkedTalentIds: event.linkedTalentIds || [],
            owner: event.owner || null,
            createdBy: req.user!.id,
            notes: event.notes || [],
          },
        });
        createdEvents.push(created);
      } catch (err) {
        console.error("Error importing event:", event, err);
        // Continue with other events
      }
    }

    res.status(201).json({
      message: `Successfully imported ${createdEvents.length} of ${events.length} events`,
      imported: createdEvents.length,
      total: events.length,
    });
  } catch (error) {
    console.error("Error batch importing events:", error);
    res.status(500).json({ error: "Failed to import events" });
  }
});

export default router;
