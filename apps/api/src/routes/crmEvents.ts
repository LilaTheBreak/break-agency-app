import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { logAdminActivity } from '../lib/adminActivityLogger.js';
import { logDestructiveAction, logAuditEvent } from '../lib/auditLogger.js';
import { logError } from '../lib/logger.js';
import { sendList, sendEmptyList, handleApiError } from '../utils/apiResponse.js';
import { isAdmin, isSuperAdmin } from '../lib/roleHelpers.js';

const router = Router();

// All CRM routes require admin access
router.use(requireAuth);
router.use((req: Request, res: Response, next) => {
  if (!isAdmin(req.user!) && !isSuperAdmin(req.user!)) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
});

/**
 * GET /api/crm-events
 * List all CRM events with optional filters
 * Note: Events are stored as CrmTask records with event metadata
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { brandId, status, owner } = req.query;

    const where: any = {};
    if (brandId) where.brandId = brandId as string;
    if (status) where.status = status as string;
    if (owner) where.owner = owner as string;
    // Filter for event-like tasks (can be identified by having eventId or specific metadata)
    // For now, we'll return all tasks that could be events

    const events = await prisma.crmTask.findMany({
      where,
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
      orderBy: {
        dueDate: "desc", // CrmTask uses dueDate, not startDateTime
      },
    });

    // Transform tasks to events format for backward compatibility
    const transformedEvents = events.map(event => {
      const metadata = (event.mentions as any) || {};
      return {
        ...event,
        eventName: event.title, // CrmTask uses title, not eventName
        startDateTime: event.dueDate, // CrmTask uses dueDate, not startDateTime
        endDateTime: metadata.endDateTime || null,
        eventType: metadata.eventType || "Other",
        location: metadata.location || null,
        description: event.description || null,
        attendees: metadata.attendees || null,
        linkedCampaignIds: metadata.linkedCampaignIds || [],
        linkedDealIds: metadata.linkedDealIds || [],
        linkedTalentIds: metadata.linkedTalentIds || [],
        notes: metadata.notes || [],
        Brand: event.CrmBrand ? {
          id: event.CrmBrand.id,
          name: event.CrmBrand.brandName,
        } : null,
      };
    });

    sendList(res, transformedEvents || []);
  } catch (error) {
    logError("Failed to fetch CRM events", error, { userId: req.user?.id });
    sendEmptyList(res);
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
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
            website: true,
            industry: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Transform task to event format
    const metadata = (event.mentions as any) || {};
    const transformedEvent = {
      ...event,
      eventName: event.title,
      startDateTime: event.dueDate,
      endDateTime: metadata.endDateTime || null,
      eventType: metadata.eventType || "Other",
      location: metadata.location || null,
      description: event.description || null,
      attendees: metadata.attendees || null,
      linkedCampaignIds: metadata.linkedCampaignIds || [],
      linkedDealIds: metadata.linkedDealIds || [],
      linkedTalentIds: metadata.linkedTalentIds || [],
      notes: metadata.notes || [],
      Brand: event.CrmBrand ? {
        id: event.CrmBrand.id,
        name: event.CrmBrand.brandName,
        website: event.CrmBrand.website,
        industry: event.CrmBrand.industry,
      } : null,
    };

    res.json(transformedEvent);
  } catch (error) {
    console.error("Error fetching CRM event:", error);
    res.status(500).json({ 
      error: "Failed to fetch event",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

    // Store event-specific fields in mentions JSON
    const eventMetadata = {
      eventType,
      endDateTime: endDateTime || null,
      location: location || null,
      attendees: attendees || null,
      linkedCampaignIds: linkedCampaignIds || [],
      linkedDealIds: linkedDealIds || [],
      linkedTalentIds: linkedTalentIds || [],
      notes: [],
    };

    const event = await prisma.crmTask.create({
      data: {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: eventName, // CrmTask uses title, not eventName
        brandId,
        status: status || "Pending", // CrmTask status, not event status
        priority: "Medium", // Default priority
        dueDate: new Date(startDateTime), // CrmTask uses dueDate, not startDateTime
        description: description || null,
        owner: owner || null,
        createdBy: req.user!.id,
        mentions: eventMetadata, // Store event metadata in mentions JSON
        updatedAt: new Date(),
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    } as any);

    // Log activity
    try {
      await logAdminActivity(req as any, {
        event: "CRM_EVENT_CREATED",
        metadata: { eventId: event.id, eventName: event.title, brandId: event.brandId }
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    // Transform response
    const transformedEvent = {
      ...event,
      eventName: event.title,
      startDateTime: event.dueDate,
      endDateTime: eventMetadata.endDateTime,
      eventType: eventMetadata.eventType,
      location: eventMetadata.location,
      attendees: eventMetadata.attendees,
      linkedCampaignIds: eventMetadata.linkedCampaignIds,
      linkedDealIds: eventMetadata.linkedDealIds,
      linkedTalentIds: eventMetadata.linkedTalentIds,
      notes: eventMetadata.notes,
      Brand: (event as any).CrmBrand ? {
        id: (event as any).CrmBrand.id,
        name: (event as any).CrmBrand.brandName,
      } : null,
    };

    res.status(201).json(transformedEvent);
  } catch (error) {
    console.error("Error creating CRM event:", error);
    res.status(500).json({ 
      error: "Failed to create event",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

    // Update CrmTask fields
    if (eventName !== undefined) updateData.title = eventName;
    if (status !== undefined) updateData.status = status;
    if (startDateTime !== undefined) updateData.dueDate = new Date(startDateTime);
    if (description !== undefined) updateData.description = description;
    if (owner !== undefined) updateData.owner = owner;

    // Update event metadata in mentions
    const existingMetadata = (existing.mentions as any) || {};
    const updatedMetadata = {
      ...existingMetadata,
      ...(eventType !== undefined && { eventType }),
      ...(endDateTime !== undefined && { endDateTime }),
      ...(location !== undefined && { location }),
      ...(attendees !== undefined && { attendees }),
      ...(linkedCampaignIds !== undefined && { linkedCampaignIds }),
      ...(linkedDealIds !== undefined && { linkedDealIds }),
      ...(linkedTalentIds !== undefined && { linkedTalentIds }),
    };
    updateData.mentions = updatedMetadata;

    const updated = await prisma.crmTask.update({
      where: { id },
      data: updateData,
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    // Log activity
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_EVENT_UPDATED",
          metadata: { eventId: updated.id, eventName: updated.title, changes: Object.keys(updateData) }
        }),
        logAuditEvent(req as any, {
          action: "EVENT_UPDATED",
          entityType: "CrmTask",
          entityId: updated.id,
          metadata: { eventName: updated.title, changes: Object.keys(updateData) }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Transform response
    const transformedEvent = {
      ...updated,
      eventName: updated.title,
      startDateTime: updated.dueDate,
      endDateTime: updatedMetadata.endDateTime,
      eventType: updatedMetadata.eventType,
      location: updatedMetadata.location,
      attendees: updatedMetadata.attendees,
      linkedCampaignIds: updatedMetadata.linkedCampaignIds,
      linkedDealIds: updatedMetadata.linkedDealIds,
      linkedTalentIds: updatedMetadata.linkedTalentIds,
      notes: updatedMetadata.notes || [],
      Brand: updated.CrmBrand ? {
        id: updated.CrmBrand.id,
        name: updated.CrmBrand.brandName,
      } : null,
    };

    res.json(transformedEvent);
  } catch (error) {
    console.error("Error updating CRM event:", error);
    res.status(500).json({ 
      error: "Failed to update event",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

    // Log destructive action
    try {
      await Promise.all([
        logAdminActivity(req as any, {
          event: "CRM_EVENT_DELETED",
          metadata: { eventId: existing.id, eventName: existing.title }
        }),
        logDestructiveAction(req as any, {
          action: "EVENT_DELETED",
          entityType: "CrmTask",
          entityId: existing.id,
          metadata: { eventName: existing.title }
        })
      ]);
    } catch (logError) {
      console.error("Failed to log activity/audit:", logError);
    }

    // Always return 200 with JSON - never 204 No Content
    res.status(200).json({ success: true });
  } catch (error) {
    logError("Failed to delete CRM event", error, { eventId: req.params.id, userId: req.user?.id });
    res.status(500).json({ 
      error: "Failed to delete event",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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

    if (!text) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const event = await prisma.crmTask.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Store note in mentions metadata
    const existingMetadata = (event.mentions as any) || {};
    const existingNotes = existingMetadata.notes || [];
    const newNote = {
      at: new Date().toISOString(),
      author: author || req.user?.email || req.user?.name || "unknown",
      text: text.trim(),
    };
    const updatedNotes = [...existingNotes, newNote];

    const updated = await prisma.crmTask.update({
      where: { id },
      data: {
        mentions: {
          ...existingMetadata,
          notes: updatedNotes,
        },
        updatedAt: new Date(),
      },
      include: {
        CrmBrand: {
          select: {
            id: true,
            brandName: true,
          },
        },
      },
    });

    // Transform response
    const transformedEvent = {
      ...updated,
      eventName: updated.title,
      startDateTime: updated.dueDate,
      endDateTime: existingMetadata.endDateTime,
      eventType: existingMetadata.eventType,
      location: existingMetadata.location,
      attendees: existingMetadata.attendees,
      linkedCampaignIds: existingMetadata.linkedCampaignIds,
      linkedDealIds: existingMetadata.linkedDealIds,
      linkedTalentIds: existingMetadata.linkedTalentIds,
      notes: updatedNotes,
      Brand: updated.CrmBrand ? {
        id: updated.CrmBrand.id,
        name: updated.CrmBrand.brandName,
      } : null,
    };

    res.json(transformedEvent);
  } catch (error) {
    console.error("Error adding note to event:", error);
    res.status(500).json({ 
      error: "Failed to add note",
      message: error instanceof Error ? error.message : "Unknown error"
    });
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
    const errors: any[] = [];

    for (const event of events) {
      try {
        if (!event.eventName || !event.brandId || !event.startDateTime) {
          errors.push({ eventName: event.eventName || "Unknown", error: "Missing required fields" });
          continue;
        }

        // Store event metadata in mentions
        const eventMetadata = {
          eventType: event.eventType || "Other",
          endDateTime: event.endDateTime || null,
          location: event.location || null,
          attendees: event.attendees || null,
          linkedCampaignIds: event.linkedCampaignIds || [],
          linkedDealIds: event.linkedDealIds || [],
          linkedTalentIds: event.linkedTalentIds || [],
          notes: event.notes || [],
        };

        const created = await prisma.crmTask.create({
          data: {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: event.eventName,
            brandId: event.brandId,
            status: event.status || "Pending",
            priority: "Medium",
            dueDate: new Date(event.startDateTime),
            description: event.description || null,
            owner: event.owner || null,
            createdBy: req.user!.id,
            mentions: [eventMetadata],
            updatedAt: new Date(),
          },
        });
        createdEvents.push(created);
      } catch (err) {
        console.error("Error importing event:", event, err);
        errors.push({ eventName: event.eventName || "Unknown", error: String(err) });
      }
    }

    res.status(201).json({
      message: `Successfully imported ${createdEvents.length} of ${events.length} events`,
      imported: createdEvents.length,
      total: events.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error batch importing events:", error);
    res.status(500).json({ 
      error: "Failed to import events",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
