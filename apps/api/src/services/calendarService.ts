// TODO: Google Calendar integration - optional feature, install 'googleapis' package if needed
// import { google } from "googleapis";
import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';

// const calendar = google.calendar("v3");

interface CalendarEventInput {
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  type?: string;
  source?: string;
  location?: string;
  status?: string;
  isAllDay?: boolean;
  metadata?: Record<string, any>;
  relatedBrandIds?: string[];
  relatedCreatorIds?: string[];
  relatedDealIds?: string[];
  relatedCampaignIds?: string[];
  relatedTaskIds?: string[];
}

interface CalendarMeeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  meetingLink?: string | null;
  description?: string | null;
  notes?: string | null;
  meetingType?: string;
  platform?: string;
  talentId?: string;
}

/**
 * Create a calendar event from a meeting
 */
export async function syncMeetingToCalendar(meeting: CalendarMeeting, userId: string) {
  try {
    logInfo('[CALENDAR_SERVICE] Syncing meeting to calendar', { meetingId: meeting.id });

    const event = await prisma.calendarEvent.create({
      data: {
        title: `Meeting: ${meeting.title}`,
        description: meeting.description || meeting.notes,
        startAt: meeting.startTime,
        endAt: meeting.endTime || new Date(new Date(meeting.startTime).getTime() + 60 * 60 * 1000),
        type: 'meeting',
        source: 'internal',
        status: 'scheduled',
        createdBy: userId,
        metadata: {
          meetingId: meeting.id,
          meetingType: meeting.meetingType,
          platform: meeting.platform,
          talentId: meeting.talentId,
        },
      },
    });

    logInfo('[CALENDAR_SERVICE] Meeting synced to calendar', {
      meetingId: meeting.id,
      eventId: event.id,
    });

    return {
      eventId: event.id,
      success: true,
    };
  } catch (err) {
    logError('[CALENDAR_SERVICE] Failed to sync meeting to calendar', err, {
      meetingId: meeting.id,
    });
    return {
      eventId: null,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventInput>
) {
  try {
    logInfo('[CALENDAR_SERVICE] Updating calendar event', { eventId });

    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: updates.title,
        description: updates.description,
        startAt: updates.startAt,
        endAt: updates.endAt,
        type: updates.type,
        source: updates.source,
        location: updates.location,
        status: updates.status,
        isAllDay: updates.isAllDay,
        metadata: updates.metadata,
        relatedBrandIds: updates.relatedBrandIds,
        relatedCreatorIds: updates.relatedCreatorIds,
        relatedDealIds: updates.relatedDealIds,
        relatedCampaignIds: updates.relatedCampaignIds,
        relatedTaskIds: updates.relatedTaskIds,
      },
    });

    logInfo('[CALENDAR_SERVICE] Calendar event updated', { eventId });

    return { success: true };
  } catch (err) {
    logError('[CALENDAR_SERVICE] Failed to update calendar event', err, { eventId });
    return { success: false };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string) {
  try {
    logInfo('[CALENDAR_SERVICE] Deleting calendar event', { eventId });

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    logInfo('[CALENDAR_SERVICE] Calendar event deleted', { eventId });

    return { success: true };
  } catch (err) {
    logError('[CALENDAR_SERVICE] Failed to delete calendar event', err, { eventId });
    return { success: false };
  }
}

/**
 * Get upcoming events from user's calendar
 */
export async function getCalendarEvents(userId: string, timeMin?: Date, timeMax?: Date) {
  try {
    const where: any = {};

    if (timeMin && timeMax) {
      where.startAt = {
        gte: timeMin,
        lte: timeMax,
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return { success: true, events };
  } catch (err) {
    logError('[CALENDAR_SERVICE] Error fetching calendar events', err, { userId });
    return { success: false, events: [] };
  }
}

/**
 * Create a calendar event from a task
 */
export async function syncTaskToCalendar(task: any, userId: string) {
  try {
    // Only create calendar event if task has a dueDate
    if (!task.dueDate) {
      return { eventId: null, success: true };
    }

    logInfo('[CALENDAR_SERVICE] Syncing task to calendar', { taskId: task.id });

    const event = await prisma.calendarEvent.create({
      data: {
        title: `Task: ${task.title}`,
        description: task.description,
        startAt: task.dueDate,
        endAt: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000),
        type: 'task',
        source: 'internal',
        status: task.status === 'completed' ? 'completed' : 'scheduled',
        createdBy: userId,
        metadata: {
          taskId: task.id,
          taskPriority: task.priority,
          taskStatus: task.status,
          brandId: task.brandId,
          dealId: task.dealId,
        },
        relatedTaskIds: [task.id],
        relatedBrandIds: task.brandId ? [task.brandId] : [],
        relatedDealIds: task.dealId ? [task.dealId] : [],
      },
    });

    logInfo('[CALENDAR_SERVICE] Task synced to calendar', {
      taskId: task.id,
      eventId: event.id,
    });

    return {
      eventId: event.id,
      success: true,
    };
  } catch (err) {
    logError('[CALENDAR_SERVICE] Failed to sync task to calendar', err, {
      taskId: task.id,
    });
    return {
      eventId: null,
      success: false,
    };
  }
}

/**
 * Link a CRM entity to a calendar event
 */
export async function linkEntityToCalendarEvent(
  eventId: string,
  entityType: 'brand' | 'creator' | 'deal' | 'campaign' | 'task',
  entityId: string
) {
  try {
    logInfo('[CALENDAR_SERVICE] Linking entity to calendar event', {
      eventId,
      entityType,
      entityId,
    });

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { success: false };
    }

    const updateData: any = {};

    switch (entityType) {
      case 'brand':
        updateData.relatedBrandIds = [
          ...new Set([...(event.relatedBrandIds || []), entityId]),
        ];
        break;
      case 'creator':
        updateData.relatedCreatorIds = [
          ...new Set([...(event.relatedCreatorIds || []), entityId]),
        ];
        break;
      case 'deal':
        updateData.relatedDealIds = [
          ...new Set([...(event.relatedDealIds || []), entityId]),
        ];
        break;
      case 'campaign':
        updateData.relatedCampaignIds = [
          ...new Set([...(event.relatedCampaignIds || []), entityId]),
        ];
        break;
      case 'task':
        updateData.relatedTaskIds = [
          ...new Set([...(event.relatedTaskIds || []), entityId]),
        ];
        break;
    }

    await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
    });

    logInfo('[CALENDAR_SERVICE] Entity linked to calendar event', {
      eventId,
      entityType,
      entityId,
    });

    return { success: true };
  } catch (err) {
    logError('[CALENDAR_SERVICE] Failed to link entity to calendar event', err, {
      eventId,
      entityType,
      entityId,
    });
    return { success: false };
  }
}
