import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { logInfo, logError } from "../../lib/logger.js";
import prisma from "../../lib/prisma.js";
// TODO: calendarService needs to be properly exported
// import { syncMeetingToCalendar, updateCalendarEvent, deleteCalendarEvent } from "../../services/calendarService.js";

const router = Router();

/**
 * GET /api/talent/:talentId/meetings
 * Get all meetings for a talent (upcoming and past)
 */
router.get("/:talentId/meetings", requireAuth, async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;
    const { upcoming = "true", limit = "10" } = req.query;

    logInfo("[MEETINGS] Fetching meetings", { talentId, upcoming });

    const where: any = { talentId };
    const pageLimit = parseInt(limit as string) || 10;

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        actionItems: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { startTime: "desc" },
      take: pageLimit,
    });

    const now = new Date();
    const upcomingMeetings = meetings.filter((m) => m.startTime > now);
    const pastMeetings = meetings.filter((m) => m.startTime <= now);

    return res.json({
      meetings,
      upcoming: upcomingMeetings,
      past: pastMeetings,
      total: meetings.length,
    });
  } catch (err) {
    logError("[MEETINGS] Error fetching meetings", err, { talentId: req.params.talentId });
    return res.status(500).json({
      error: "Failed to fetch meetings",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/meetings/:meetingId
 * Get a single meeting with all details
 */
router.get("/:meetingId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    logInfo("[MEETINGS] Fetching meeting details", { meetingId });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        talent: {
          select: { id: true, name: true, displayName: true },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        actionItems: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json(meeting);
  } catch (err) {
    logError("[MEETINGS] Error fetching meeting", err, { meetingId: req.params.meetingId });
    return res.status(500).json({
      error: "Failed to fetch meeting",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * POST /api/talent/:talentId/meetings
 * Create a new meeting
 */
router.post("/:talentId/meetings", requireAuth, async (req: Request, res: Response) => {
  try {
    const { talentId } = req.params;
    const { title, description, meetingType, platform, meetingLink, startTime, endTime, notes, summary } = req.body;
    const userId = (req as any).user?.id;

    // Validation
    if (!title || !startTime) {
      return res.status(400).json({ error: "Title and startTime are required" });
    }

    logInfo("[MEETINGS] Creating meeting", { talentId, title });

    // Create meeting in database
    const meeting = await prisma.meeting.create({
      data: {
        talentId,
        title,
        description,
        meetingType: meetingType || "Internal",
        platform: platform || "In-Person",
        meetingLink,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        notes,
        summary,
        createdBy: userId,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        actionItems: true,
      },
    });

    // Try to sync with calendar
    try {
      // TODO: Calendar sync - calendarService not available yet
      // const calendarResult = await syncMeetingToCalendar(meeting, userId);
      // if (calendarResult.eventId) {
      //   await prisma.meeting.update({
      //     where: { id: meeting.id },
      //     data: {
      //       calendarEventId: calendarResult.eventId,
      //       calendarProvider: "google",
      //     },
      //   });
      //   logInfo("[MEETINGS] Meeting synced to calendar", { meetingId: meeting.id, eventId: calendarResult.eventId });
      // }
      logInfo("[MEETINGS] Calendar sync skipped (calendarService unavailable)", { meetingId: meeting.id });
    } catch (calendarErr) {
      logError("[MEETINGS] Calendar sync failed", calendarErr, { meetingId: meeting.id });
      // Don't fail the request - calendar sync is optional
    }

    return res.status(201).json(meeting);
  } catch (err) {
    logError("[MEETINGS] Error creating meeting", err, { talentId: req.params.talentId });
    return res.status(500).json({
      error: "Failed to create meeting",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * PUT /api/meetings/:meetingId
 * Update an existing meeting
 */
router.put("/:meetingId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { title, description, meetingType, platform, meetingLink, startTime, endTime, notes, summary } = req.body;

    logInfo("[MEETINGS] Updating meeting", { meetingId });

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        title: title || undefined,
        description: description || undefined,
        meetingType: meetingType || undefined,
        platform: platform || undefined,
        meetingLink: meetingLink || undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        notes: notes || undefined,
        summary: summary || undefined,
        updatedAt: new Date(),
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        actionItems: true,
      },
    });

    // Update calendar event if times changed
    if ((startTime || endTime) && existingMeeting.calendarEventId) {
      try {
        // TODO: Calendar sync - calendarService not available yet
        // await updateCalendarEvent(existingMeeting.calendarEventId, updatedMeeting);
        logInfo("[MEETINGS] Calendar event update skipped (calendarService unavailable)", { eventId: existingMeeting.calendarEventId });
      } catch (calendarErr) {
        logError("[MEETINGS] Calendar update failed", calendarErr, { meetingId });
      }
    }

    return res.json(updatedMeeting);
  } catch (err) {
    logError("[MEETINGS] Error updating meeting", err, { meetingId: req.params.meetingId });
    return res.status(500).json({
      error: "Failed to update meeting",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * DELETE /api/meetings/:meetingId
 * Delete a meeting
 */
router.delete("/:meetingId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    logInfo("[MEETINGS] Deleting meeting", { meetingId });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Delete from calendar if synced
    if (meeting.calendarEventId) {
      try {
        // TODO: Calendar sync - calendarService not available yet
        // await deleteCalendarEvent(meeting.calendarEventId);
        logInfo("[MEETINGS] Calendar event deletion skipped (calendarService unavailable)", { eventId: meeting.calendarEventId });
      } catch (calendarErr) {
        logError("[MEETINGS] Calendar deletion failed", calendarErr, { meetingId });
      }
    }

    // Delete the meeting and its action items
    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    return res.json({ success: true, id: meetingId });
  } catch (err) {
    logError("[MEETINGS] Error deleting meeting", err, { meetingId: req.params.meetingId });
    return res.status(500).json({
      error: "Failed to delete meeting",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * POST /api/meetings/:meetingId/action-items
 * Create an action item for a meeting
 */
router.post("/:meetingId/action-items", requireAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { title, description, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    logInfo("[MEETINGS] Creating action item", { meetingId, title });

    // Get the meeting to get talentId
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { talentId: true },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const actionItem = await prisma.meetingActionItem.create({
      data: {
        meetingId,
        talentId: meeting.talentId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: "open",
      },
    });

    return res.status(201).json(actionItem);
  } catch (err) {
    logError("[MEETINGS] Error creating action item", err, { meetingId: req.params.meetingId });
    return res.status(500).json({
      error: "Failed to create action item",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * PUT /api/action-items/:actionItemId
 * Update an action item
 */
router.put("/action-items/:actionItemId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { actionItemId } = req.params;
    const { title, description, dueDate, status } = req.body;

    logInfo("[MEETINGS] Updating action item", { actionItemId });

    const actionItem = await prisma.meetingActionItem.update({
      where: { id: actionItemId },
      data: {
        title: title || undefined,
        description: description || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: status || undefined,
        completedAt: status === "completed" ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return res.json(actionItem);
  } catch (err) {
    logError("[MEETINGS] Error updating action item", err, { actionItemId: req.params.actionItemId });
    return res.status(500).json({
      error: "Failed to update action item",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * DELETE /api/action-items/:actionItemId
 * Delete an action item
 */
router.delete("/action-items/:actionItemId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { actionItemId } = req.params;

    logInfo("[MEETINGS] Deleting action item", { actionItemId });

    const actionItem = await prisma.meetingActionItem.findUnique({
      where: { id: actionItemId },
    });

    if (!actionItem) {
      return res.status(404).json({ error: "Action item not found" });
    }

    await prisma.meetingActionItem.delete({
      where: { id: actionItemId },
    });

    return res.json({ success: true, id: actionItemId });
  } catch (err) {
    logError("[MEETINGS] Error deleting action item", err, { actionItemId: req.params.actionItemId });
    return res.status(500).json({
      error: "Failed to delete action item",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * POST /api/action-items/:actionItemId/add-to-tasks
 * Convert an action item to a task in the Tasks system
 */
router.post("/action-items/:actionItemId/add-to-tasks", requireAuth, async (req: Request, res: Response) => {
  try {
    const { actionItemId } = req.params;
    const userId = (req as any).user?.id;

    logInfo("[MEETINGS] Converting action item to task", { actionItemId });

    const actionItem = await prisma.meetingActionItem.findUnique({
      where: { id: actionItemId },
    });

    if (!actionItem) {
      return res.status(404).json({ error: "Action item not found" });
    }

    if (actionItem.linkedTaskId) {
      return res.status(400).json({ error: "Action item is already linked to a task" });
    }

    // Create a task
    const task = await prisma.talentTask.create({
      data: {
        talentId: actionItem.talentId,
        title: actionItem.title,
        notes: `From meeting action item: ${actionItem.description || ""}`,
        dueDate: actionItem.dueDate,
        createdBy: userId,
      },
    });

    // Link the action item to the task
    const updatedActionItem = await prisma.meetingActionItem.update({
      where: { id: actionItemId },
      data: {
        linkedTaskId: task.id,
        updatedAt: new Date(),
      },
    });

    logInfo("[MEETINGS] Action item linked to task", { actionItemId, taskId: task.id });

    return res.json({
      actionItem: updatedActionItem,
      task,
    });
  } catch (err) {
    logError("[MEETINGS] Error converting action item to task", err, { actionItemId: req.params.actionItemId });
    return res.status(500).json({
      error: "Failed to add action item to tasks",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
