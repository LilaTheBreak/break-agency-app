import { Router, type Request, type Response } from "express";
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { z } from "zod";
import { getEffectiveUserId, enforceDataScoping } from '../lib/dataScopingHelpers.js';
import { isAdmin, isSuperAdmin } from '../lib/roleHelpers.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

const CalendarEventCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().refine(d => !isNaN(Date.parse(d)), "Invalid date"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.enum(["meeting", "deadline", "personal", "other"]).default("meeting"),
  description: z.string().optional(),
  visibleToTalent: z.boolean().optional().default(true),
});

type CalendarEventInput = z.infer<typeof CalendarEventCreateSchema>;

/**
 * Convert frontend format to datetime
 */
function buildDateTime(date: string, time?: string): Date {
  if (!time) {
    // If no time provided, use midnight UTC
    return new Date(`${date}T00:00:00Z`);
  }
  return new Date(`${date}T${time}:00Z`);
}

/**
 * Format datetime for frontend
 */
function formatDateTimeForFrontend(dt: Date): { date: string; time: string } {
  const dateStr = dt.toISOString().split('T')[0];
  const timeStr = dt.toISOString().split('T')[1].substring(0, 5);
  return { date: dateStr, time: timeStr };
}

/**
 * GET /api/talent/:talentId/calendar
 * Fetch all calendar events for a specific talent
 * - Admins see all events
 * - Talents see only events marked as visibleToTalent
 */
router.get("/:talentId/calendar", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;
    const user = req.user!;
    const isRequesterAdmin = isAdmin(user) || isSuperAdmin(user);

    // Verify user has permission to view this talent's calendar
    if (!isRequesterAdmin) {
      // Non-admin users can only view their own calendar
      const effectiveUserId = getEffectiveUserId(req);
      if (talentId !== effectiveUserId) {
        return res.status(403).json({ error: "Cannot access other talent's calendar" });
      }
    }

    // Fetch calendar events for the talent
    // Talents only see events marked as visibleToTalent
    const where: any = {
      relatedCreatorIds: {
        has: talentId,
      },
    };

    // If talent (not admin) is requesting, filter to only visible events
    if (!isRequesterAdmin) {
      where.metadata = {
        path: ["visibleToTalent"],
        equals: true,
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: {
        startAt: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        type: true,
        location: true,
        status: true,
        isAllDay: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format for frontend
    const formattedEvents = events.map(event => {
      const { date, time } = formatDateTimeForFrontend(event.startAt);
      const { date: endDate, time: endTime } = formatDateTimeForFrontend(event.endAt);
      const visibleToTalent = (event.metadata as any)?.visibleToTalent ?? true;
      
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date,
        startTime: time,
        endTime: endTime !== time ? endTime : "",
        type: event.type,
        location: event.location,
        status: event.status,
        isAllDay: event.isAllDay,
        visibleToTalent,
      };
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error("[Talent Calendar] Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

/**
 * POST /api/talent/:talentId/calendar
 * Create a new calendar event for a talent
 */
router.post("/:talentId/calendar", async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;
    const user = req.user!;

    // Verify user has permission to create events for this talent
    if (!isAdmin(user) && !isSuperAdmin(user)) {
      // Non-admin users can only create events for themselves
      const effectiveUserId = getEffectiveUserId(req);
      if (talentId !== effectiveUserId) {
        return res.status(403).json({ error: "Cannot create events for other talent" });
      }
    }

    // Validate input
    const parsed = CalendarEventCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Invalid event data",
        details: parsed.error.flatten()
      });
    }

    const { title, date, startTime, endTime, type, description, visibleToTalent } = parsed.data;

    // Build datetime objects
    const startAt = buildDateTime(date, startTime);
    const endAtTime = endTime || startTime;
    let endAt = buildDateTime(date, endAtTime);

    // Ensure endAt is after startAt
    if (endAt <= startAt) {
      endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // Add 1 hour if not specified
    }

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        startAt,
        endAt,
        type,
        source: "internal",
        location: null,
        status: "scheduled",
        isAllDay: false,
        createdBy: user.id,
        relatedCreatorIds: [talentId],
        metadata: {
          visibleToTalent: visibleToTalent ?? true,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        type: true,
        location: true,
        status: true,
        isAllDay: true,
        metadata: true,
      },
    });

    // Format for frontend
    const { date: formattedDate, time: formattedTime } = formatDateTimeForFrontend(event.startAt);
    const { time: formattedEndTime } = formatDateTimeForFrontend(event.endAt);
    const responseVisibleToTalent = (event.metadata as any)?.visibleToTalent ?? true;

    const response = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: formattedDate,
      startTime: formattedTime,
      endTime: formattedEndTime !== formattedTime ? formattedEndTime : "",
      type: event.type,
      location: event.location,
      visibleToTalent: responseVisibleToTalent,
      status: event.status,
      isAllDay: event.isAllDay,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("[Talent Calendar] Error creating event:", error);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

/**
 * DELETE /api/talent/:talentId/calendar/:eventId
 * Delete a calendar event
 */
router.delete("/:talentId/calendar/:eventId", async (req: Request, res: Response) => {
  try {
    const { talentId, eventId } = req.params;
    const user = req.user!;

    // Verify user has permission to delete events for this talent
    if (!isAdmin(user) && !isSuperAdmin(user)) {
      // Non-admin users can only delete their own events
      const effectiveUserId = getEffectiveUserId(req);
      if (talentId !== effectiveUserId) {
        return res.status(403).json({ error: "Cannot delete events for other talent" });
      }
    }

    // Verify the event belongs to this talent
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        relatedCreatorIds: {
          has: talentId,
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    // Delete the event
    await prisma.calendarEvent.delete({
      where: {
        id: eventId,
      },
    });

    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("[Talent Calendar] Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});

/**
 * PATCH /api/talent/:talentId/calendar/:eventId
 * Update a calendar event
 */
router.patch("/:talentId/calendar/:eventId", async (req: Request, res: Response) => {
  try {
    const { talentId, eventId } = req.params;
    const user = req.user!;

    // Verify user has permission to update events for this talent
    if (!isAdmin(user) && !isSuperAdmin(user)) {
      const effectiveUserId = getEffectiveUserId(req);
      if (talentId !== effectiveUserId) {
        return res.status(403).json({ error: "Cannot update events for other talent" });
      }
    }

    // Verify the event belongs to this talent
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        relatedCreatorIds: {
          has: talentId,
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    // Validate input (all fields optional for update)
    const UpdateSchema = z.object({
      title: z.string().min(1).optional(),
      date: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      type: z.enum(["meeting", "deadline", "personal", "other"]).optional(),
      description: z.string().optional(),
      status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
      visibleToTalent: z.boolean().optional(),
    });

    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Invalid update data",
        details: parsed.error.flatten()
      });
    }

    const { title, date, startTime, endTime, type, description, status, visibleToTalent } = parsed.data;

    // Build update object
    const updateData: any = {};
    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description || null;
    if (status) updateData.status = status;
    if (visibleToTalent !== undefined) {
      // Update metadata with visibility flag
      updateData.metadata = {
        ...((event.metadata as any) || {}),
        visibleToTalent,
      };
    }

    // Handle datetime updates
    if (date || startTime) {
      const newDate = date || formatDateTimeForFrontend(event.startAt).date;
      const newStartTime = startTime || formatDateTimeForFrontend(event.startAt).time;
      updateData.startAt = buildDateTime(newDate, newStartTime);

      // Update endAt accordingly
      const newEndTime = endTime || formatDateTimeForFrontend(event.endAt).time;
      updateData.endAt = buildDateTime(newDate, newEndTime);

      // Ensure endAt is after startAt
      if (updateData.endAt <= updateData.startAt) {
        updateData.endAt = new Date(updateData.startAt.getTime() + 60 * 60 * 1000);
      }
    }

    // Update the event
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        type: true,
        location: true,
        status: true,
        isAllDay: true,
        metadata: true,
      },
    });

    // Format for frontend
    const { date: formattedDate, time: formattedTime } = formatDateTimeForFrontend(updatedEvent.startAt);
    const { time: formattedEndTime } = formatDateTimeForFrontend(updatedEvent.endAt);
    const updatedVisibleToTalent = (updatedEvent.metadata as any)?.visibleToTalent ?? true;

    const response = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      date: formattedDate,
      startTime: formattedTime,
      endTime: formattedEndTime !== formattedTime ? formattedEndTime : "",
      type: updatedEvent.type,
      location: updatedEvent.location,
      status: updatedEvent.status,
      isAllDay: updatedEvent.isAllDay,
      visibleToTalent: updatedVisibleToTalent,
    };

    res.json(response);
  } catch (error) {
    console.error("[Talent Calendar] Error updating event:", error);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

export default router;
