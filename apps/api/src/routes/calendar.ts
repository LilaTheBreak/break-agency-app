import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from "zod";
import { getGoogleCalendarClient, syncGoogleCalendarEvents } from '../lib/google.js';
import { checkEventConflicts, checkAvailability } from '../services/calendarConflictService.js';

const router = Router();

// Helper function to log audit events
async function logCalendarAudit(userId: string, action: string, entityId?: string, metadata?: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: "CalendarEvent",
        entityId: entityId || null,
        metadata: metadata as any,
      },
    });
  } catch (error) {
    console.error("[AUDIT] Failed to log calendar event:", error);
  }
}

// All routes require authentication
router.use(requireAuth);

/**
 * GET /events
 * Fetches all calendar events for the logged-in user or all events for admins
 */
router.get("/events", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    // Admins can see all events, creators see only their own
    const whereClause = userRole === "SUPERADMIN" || userRole === "ADMIN" 
      ? {} 
      : { createdBy: userId };

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: {
        startAt: "asc",
      },
      include: {
        Creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logCalendarAudit(userId, "CALENDAR_VIEWED", undefined, { eventCount: events.length });

    res.json({ success: true, data: { events } });
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    res.status(500).json({ success: false, error: "Could not load calendar events." });
  }
});

const EventCreateSchema = z.object({
  title: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(["meeting", "event", "content"]).optional().default("event"),
  isAllDay: z.boolean().optional().default(false),
  location: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  relatedBrandIds: z.array(z.string()).optional().default([]),
  relatedCreatorIds: z.array(z.string()).optional().default([]),
  relatedDealIds: z.array(z.string()).optional().default([]),
  relatedCampaignIds: z.array(z.string()).optional().default([]),
});

/**
 * POST /events
 * Creates a new calendar event.
 */
router.post("/events", async (req: Request, res: Response) => {
  const parsed = EventCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const userId = req.user!.id;

    // Check for conflicts before creating
    const startAt = new Date(parsed.data.startTime);
    const endAt = new Date(parsed.data.endTime);
    const conflictResult = await checkEventConflicts(userId, startAt, endAt);

    // Store conflict info in metadata
    const metadata = {
      ...parsed.data.metadata,
      category: parsed.data.category || parsed.data.type,
      hasConflict: conflictResult.hasConflict,
      conflictingEventIds: conflictResult.conflictingEvents.map(e => e.id),
    };

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title: parsed.data.title,
        startAt: new Date(parsed.data.startTime),
        endAt: new Date(parsed.data.endTime),
        type: parsed.data.type,
        description: parsed.data.description || null,
        location: parsed.data.location || null,
        isAllDay: parsed.data.isAllDay,
        source: "internal",
        status: "scheduled",
        createdBy: userId,
        metadata,
        relatedBrandIds: parsed.data.relatedBrandIds,
        relatedCreatorIds: parsed.data.relatedCreatorIds,
        relatedDealIds: parsed.data.relatedDealIds,
        relatedCampaignIds: parsed.data.relatedCampaignIds,
      },
      include: {
        Creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logCalendarAudit(userId, "CALENDAR_EVENT_CREATED", newEvent.id, {
      title: newEvent.title,
      type: newEvent.type,
      startAt: newEvent.startAt,
      hasConflict: conflictResult.hasConflict,
    });

    res.status(201).json({
      success: true,
      data: {
        event: newEvent,
        conflicts: conflictResult.hasConflict ? conflictResult : null,
      },
    });
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    res.status(500).json({ success: false, error: "Could not create event." });
  }
});

/**
 * PUT /events/:id
 * Updates an existing calendar event
 */
router.put("/events/:id", async (req: Request, res: Response) => {
  const parsed = EventCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: "Invalid payload.", details: parsed.error.flatten() });
  }

  try {
    const eventId = req.params.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Check if event exists and user has permission
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return res.status(404).json({ success: false, error: "Event not found." });
    }

    // Only creator or admins can update
    if (existingEvent.createdBy !== userId && userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
      return res.status(403).json({ success: false, error: "You do not have permission to update this event." });
    }

    const updateData: any = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.startTime !== undefined) updateData.startAt = new Date(parsed.data.startTime);
    if (parsed.data.endTime !== undefined) updateData.endAt = new Date(parsed.data.endTime);
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
    if (parsed.data.isAllDay !== undefined) updateData.isAllDay = parsed.data.isAllDay;
    if (parsed.data.relatedBrandIds !== undefined) updateData.relatedBrandIds = parsed.data.relatedBrandIds;
    if (parsed.data.relatedCreatorIds !== undefined) updateData.relatedCreatorIds = parsed.data.relatedCreatorIds;
    if (parsed.data.relatedDealIds !== undefined) updateData.relatedDealIds = parsed.data.relatedDealIds;
    if (parsed.data.relatedCampaignIds !== undefined) updateData.relatedCampaignIds = parsed.data.relatedCampaignIds;
    
    // Check for conflicts if time is being updated
    let conflictResult = null;
    if (parsed.data.startTime !== undefined || parsed.data.endTime !== undefined) {
      const startAt = parsed.data.startTime ? new Date(parsed.data.startTime) : existingEvent.startAt;
      const endAt = parsed.data.endTime ? new Date(parsed.data.endTime) : existingEvent.endAt;
      conflictResult = await checkEventConflicts(userId, startAt, endAt, eventId);
    }

    if (parsed.data.metadata !== undefined || parsed.data.category !== undefined || conflictResult) {
      updateData.metadata = {
        ...(existingEvent.metadata as any || {}),
        ...parsed.data.metadata,
        category: parsed.data.category || (existingEvent.metadata as any)?.category,
        ...(conflictResult ? {
          hasConflict: conflictResult.hasConflict,
          conflictingEventIds: conflictResult.conflictingEvents.map(e => e.id),
        } : {}),
      };
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        Creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logCalendarAudit(userId, "CALENDAR_EVENT_UPDATED", updatedEvent.id, {
      title: updatedEvent.title,
      changes: Object.keys(updateData),
      hasConflict: conflictResult?.hasConflict || false,
    });

    res.json({
      success: true,
      data: {
        event: updatedEvent,
        conflicts: conflictResult?.hasConflict ? conflictResult : null,
      },
    });
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    res.status(500).json({ success: false, error: "Could not update event." });
  }
});

/**
 * DELETE /events/:id
 * Deletes a calendar event.
 */
router.delete("/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Ensure the user can only delete their own events (or admins can delete any)
    const eventToDelete = await prisma.calendarEvent.findFirst({
      where: { id: eventId },
    });

    if (!eventToDelete) {
      return res.status(404).json({ success: false, error: "Event not found or you do not have permission to delete it." });
    }

    // Only creator or admins can delete
    if (eventToDelete.createdBy !== userId && userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
      return res.status(403).json({ success: false, error: "You do not have permission to delete this event." });
    }

    await prisma.calendarEvent.delete({ where: { id: eventId } });

    // Log audit event
    await logCalendarAudit(userId, "CALENDAR_EVENT_DELETED", eventId, {
      title: eventToDelete.title,
      startAt: eventToDelete.startAt,
    });

    // Always return 200 with JSON - never 204 No Content
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    res.status(500).json({ success: false, error: "Could not delete event." });
  }
});

export default router;