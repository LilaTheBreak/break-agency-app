import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { logInfo, logError } from "../../lib/logger.js";
import prisma from "../../lib/prisma.js";
import { fullSyncGoogleCalendar } from "../../services/googleCalendarSync.js";

const router = Router();

/**
 * GET /api/calendar/events
 * Fetch all calendar events with optional filtering
 */
router.get("/events", requireAuth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, source, status } = req.query;
    const userId = (req as any).user?.id;

    logInfo("[CALENDAR] Fetching calendar events", { userId, startDate, endDate });

    // Build filter conditions
    const where: any = {};

    if (startDate && endDate) {
      where.startAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (type) {
      where.type = type;
    }

    if (source) {
      where.source = source;
    }

    if (status) {
      where.status = status;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startAt: "asc" },
    });

    return res.json({
      success: true,
      events,
      total: events.length,
    });
  } catch (err) {
    logError("[CALENDAR] Error fetching events", err, { userId: (req as any).user?.id });
    return res.status(500).json({
      error: "Failed to fetch calendar events",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/calendar/events/:eventId
 * Fetch a single calendar event
 */
router.get("/events/:eventId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    logInfo("[CALENDAR] Fetching calendar event", { eventId });

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    return res.json(event);
  } catch (err) {
    logError("[CALENDAR] Error fetching event", err, { eventId: req.params.eventId });
    return res.status(500).json({
      error: "Failed to fetch calendar event",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
router.post("/events", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      type,
      source,
      location,
      status,
      isAllDay,
      metadata,
      relatedBrandIds,
      relatedCreatorIds,
      relatedDealIds,
      relatedCampaignIds,
      relatedTaskIds,
    } = req.body;

    const userId = (req as any).user?.id;

    // Validation
    if (!title || !startTime) {
      return res.status(400).json({ error: "Title and startTime are required" });
    }

    logInfo("[CALENDAR] Creating calendar event", { userId, title });

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        startAt: new Date(startTime),
        endAt: endTime ? new Date(endTime) : new Date(startTime),
        type: type || "event",
        source: source || "internal",
        location: location || null,
        status: status || "scheduled",
        isAllDay: isAllDay || false,
        createdBy: userId,
        metadata: metadata || null,
        relatedBrandIds: relatedBrandIds || [],
        relatedCreatorIds: relatedCreatorIds || [],
        relatedDealIds: relatedDealIds || [],
        relatedCampaignIds: relatedCampaignIds || [],
        relatedTaskIds: relatedTaskIds || [],
      },
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logInfo("[CALENDAR] Calendar event created", { eventId: event.id });

    return res.status(201).json(event);
  } catch (err) {
    logError("[CALENDAR] Error creating event", err, { userId: (req as any).user?.id });
    return res.status(500).json({
      error: "Failed to create calendar event",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * PUT /api/calendar/events/:eventId
 * Update a calendar event
 */
router.put("/events/:eventId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      type,
      source,
      location,
      status,
      isAllDay,
      metadata,
      relatedBrandIds,
      relatedCreatorIds,
      relatedDealIds,
      relatedCampaignIds,
      relatedTaskIds,
    } = req.body;

    logInfo("[CALENDAR] Updating calendar event", { eventId });

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        startAt: startTime ? new Date(startTime) : undefined,
        endAt: endTime ? new Date(endTime) : undefined,
        type: type !== undefined ? type : undefined,
        source: source !== undefined ? source : undefined,
        location: location !== undefined ? location : undefined,
        status: status !== undefined ? status : undefined,
        isAllDay: isAllDay !== undefined ? isAllDay : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
        relatedBrandIds: relatedBrandIds !== undefined ? relatedBrandIds : undefined,
        relatedCreatorIds: relatedCreatorIds !== undefined ? relatedCreatorIds : undefined,
        relatedDealIds: relatedDealIds !== undefined ? relatedDealIds : undefined,
        relatedCampaignIds: relatedCampaignIds !== undefined ? relatedCampaignIds : undefined,
        relatedTaskIds: relatedTaskIds !== undefined ? relatedTaskIds : undefined,
      },
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    logInfo("[CALENDAR] Calendar event updated", { eventId });

    return res.json(updatedEvent);
  } catch (err) {
    logError("[CALENDAR] Error updating event", err, { eventId: req.params.eventId });
    return res.status(500).json({
      error: "Failed to update calendar event",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * DELETE /api/calendar/events/:eventId
 * Delete a calendar event
 */
router.delete("/events/:eventId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    logInfo("[CALENDAR] Deleting calendar event", { eventId });

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    logInfo("[CALENDAR] Calendar event deleted", { eventId });

    return res.json({ success: true, id: eventId });
  } catch (err) {
    logError("[CALENDAR] Error deleting event", err, { eventId: req.params.eventId });
    return res.status(500).json({
      error: "Failed to delete calendar event",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * POST /api/calendar/events/sync
 * Sync calendar events (Google Calendar bidirectional sync)
 */
router.post("/events/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    logInfo("[CALENDAR] Syncing calendar events", { userId });

    // Call Google Calendar sync service
    const syncResult = await fullSyncGoogleCalendar(userId);

    if (!syncResult.success) {
      logInfo("[CALENDAR] Sync completed with errors", { userId, ...syncResult });
      return res.status(200).json({
        ...syncResult,
      });
    }

    return res.json({
      ...syncResult,
    });
  } catch (err) {
    logError("[CALENDAR] Error syncing calendar", err, { userId: (req as any).user?.id });
    return res.status(500).json({
      error: "Failed to sync calendar",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
