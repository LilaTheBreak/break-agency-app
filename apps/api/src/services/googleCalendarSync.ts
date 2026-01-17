import prisma from '../lib/prisma.js';
import { logInfo, logError } from '../lib/logger.js';

/**
 * Google Calendar Sync Service
 * 
 * Handles bidirectional synchronization between CRM calendar and Google Calendar
 * Features:
 * - OAuth token management and refresh
 * - Inbound sync (Google Calendar → CRM)
 * - Outbound sync (CRM → Google Calendar)
 * - Conflict detection and resolution
 * - Duplicate prevention
 */

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * Get Google Calendar OAuth credentials for a user
 * NOTE: Requires User model to have googleRefreshToken and googleAccessToken fields
 */
export async function getUserGoogleCalendarAuth(userId: string) {
  try {
    // NOTE: These fields need to be added to User model in schema.prisma
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: {
    //     googleRefreshToken: true,
    //     googleAccessToken: true,
    //     googleTokenExpiry: true,
    //   },
    // });
    
    logInfo('[GOOGLE_CALENDAR_SYNC] User model missing OAuth fields', { userId });
    return null;
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Error fetching user auth', err, { userId });
    return null;
  }
}

/**
 * Refresh Google OAuth token
 * NOTE: Requires googleapis package and proper token storage
 */
export async function refreshGoogleToken(userId: string, refreshToken: string) {
  try {
    logInfo('[GOOGLE_CALENDAR_SYNC] Refresh token requested', { userId });
    
    // TODO: Implement using Google OAuth2 client
    // const oauth2Client = new google.auth.OAuth2(
    //   process.env.GOOGLE_CLIENT_ID,
    //   process.env.GOOGLE_CLIENT_SECRET,
    //   process.env.GOOGLE_REDIRECT_URI
    // );
    // oauth2Client.setCredentials({ refresh_token: refreshToken });
    // const { credentials } = await oauth2Client.refreshAccessToken();
    // 
    // // Update user with new tokens
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     googleAccessToken: credentials.access_token,
    //     googleTokenExpiry: new Date(credentials.expiry_date || 0),
    //   },
    // });
    
    return { success: false, message: 'OAuth implementation pending' };
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Token refresh failed', err, { userId });
    return { success: false, message: 'Failed to refresh token' };
  }
}

/**
 * Sync events from Google Calendar to CRM
 */
export async function syncFromGoogleCalendar(userId: string) {
  try {
    logInfo('[GOOGLE_CALENDAR_SYNC] Starting inbound sync from Google Calendar', { userId });

    const auth = await getUserGoogleCalendarAuth(userId);
    if (!auth) {
      return {
        success: false,
        message: 'User not authenticated with Google Calendar',
        synced: 0,
      };
    }

    // TODO: Implement using Google Calendar API
    // 1. Fetch events from Google Calendar with updated time
    // 2. For each event:
    //    a. Check if CalendarEvent exists by externalCalendarId
    //    b. If exists, update it (unless it was modified in CRM after Google sync)
    //    c. If not exists, create new CalendarEvent
    // 3. Handle deleted events (soft delete in CRM)

    return {
      success: false,
      message: 'Google Calendar API implementation pending',
      synced: 0,
    };
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Inbound sync failed', err, { userId });
    return {
      success: false,
      message: 'Failed to sync from Google Calendar',
      synced: 0,
    };
  }
}

/**
 * Sync events from CRM to Google Calendar
 */
export async function syncToGoogleCalendar(userId: string, eventId?: string) {
  try {
    logInfo('[GOOGLE_CALENDAR_SYNC] Starting outbound sync to Google Calendar', {
      userId,
      eventId,
    });

    const auth = await getUserGoogleCalendarAuth(userId);
    if (!auth) {
      return {
        success: false,
        message: 'User not authenticated with Google Calendar',
        synced: 0,
      };
    }

    // TODO: Implement using Google Calendar API
    // 1. Fetch CalendarEvents that need syncing (source: "internal", no externalCalendarId)
    // 2. For each event:
    //    a. Create event in Google Calendar
    //    b. Store externalCalendarId in CalendarEvent.metadata
    //    c. Set lastSyncedAt timestamp
    // 3. Handle conflicts (CRM wins in case of tie)

    return {
      success: false,
      message: 'Google Calendar API implementation pending',
      synced: 0,
    };
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Outbound sync failed', err, { userId });
    return {
      success: false,
      message: 'Failed to sync to Google Calendar',
      synced: 0,
    };
  }
}

/**
 * Bidirectional sync (full sync)
 */
export async function fullSyncGoogleCalendar(userId: string) {
  try {
    logInfo('[GOOGLE_CALENDAR_SYNC] Starting full bidirectional sync', { userId });

    // Step 1: Inbound sync (Google → CRM)
    const inboundResult = await syncFromGoogleCalendar(userId);
    if (!inboundResult.success) {
      logError('[GOOGLE_CALENDAR_SYNC] Inbound sync failed', {}, { userId });
      return {
        success: false,
        message: 'Inbound sync failed: ' + inboundResult.message,
        inbound: { synced: 0 },
        outbound: { synced: 0 },
      };
    }

    // Step 2: Outbound sync (CRM → Google)
    const outboundResult = await syncToGoogleCalendar(userId);
    if (!outboundResult.success) {
      logError('[GOOGLE_CALENDAR_SYNC] Outbound sync failed', {}, { userId });
      return {
        success: false,
        message: 'Outbound sync failed: ' + outboundResult.message,
        inbound: inboundResult,
        outbound: { synced: 0 },
      };
    }

    logInfo('[GOOGLE_CALENDAR_SYNC] Full sync completed', {
      userId,
      inbound: inboundResult.synced,
      outbound: outboundResult.synced,
    });

    return {
      success: true,
      message: 'Sync completed successfully',
      inbound: inboundResult,
      outbound: outboundResult,
    };
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Full sync failed', err, { userId });
    return {
      success: false,
      message: 'Full sync failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Check for calendar conflicts between events
 */
export async function checkConflict(startAt: Date, endAt: Date, excludeEventId?: string) {
  try {
    const conflicts = await prisma.calendarEvent.findMany({
      where: {
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        status: { not: 'cancelled' },
        ...(excludeEventId && { NOT: { id: excludeEventId } }),
      },
    });

    return conflicts;
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Conflict check failed', err);
    return [];
  }
}

/**
 * Handle duplicate detection
 * Check if an event already exists by externalCalendarId or by matching metadata
 */
export async function checkDuplicate(
  externalCalendarId?: string,
  metadata?: Record<string, any>
) {
  try {
    // Check by externalCalendarId in metadata (application-level filtering)
    if (externalCalendarId) {
      const events = await prisma.calendarEvent.findMany({
        take: 1000, // Reasonable limit
      });

      const byExternalId = events.find(event => {
        if (!event.metadata || typeof event.metadata !== 'object') return false;
        const metadataObj = event.metadata as Record<string, any>;
        return metadataObj.externalCalendarId === externalCalendarId;
      });

      if (byExternalId) {
        return byExternalId;
      }
    }

    // Check by meetingId or taskId in metadata
    if (metadata?.meetingId) {
      const events = await prisma.calendarEvent.findMany({
        take: 1000,
      });

      const byMeetingId = events.find(event => {
        if (!event.metadata || typeof event.metadata !== 'object') return false;
        const metadataObj = event.metadata as Record<string, any>;
        return metadataObj.meetingId === metadata.meetingId;
      });

      if (byMeetingId) {
        return byMeetingId;
      }
    }

    if (metadata?.taskId) {
      const events = await prisma.calendarEvent.findMany({
        take: 1000,
      });

      const byTaskId = events.find(event => {
        if (!event.metadata || typeof event.metadata !== 'object') return false;
        const metadataObj = event.metadata as Record<string, any>;
        return metadataObj.taskId === metadata.taskId;
      });

      if (byTaskId) {
        return byTaskId;
      }
    }

    return null;
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Duplicate check failed', err);
    return null;
  }
}

/**
 * Get calendar events that need syncing to Google Calendar
 */
export async function getEventsNeedingGoogleSync(userId: string, limit: number = 100) {
  try {
    // Fetch all events and filter in application code
    // (Prisma doesn't support complex JSON queries well)
    const events = await prisma.calendarEvent.findMany({
      where: {
        createdBy: userId,
        source: 'internal',
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    // Filter events that don't have externalCalendarId in metadata
    return events.filter(event => {
      if (!event.metadata || typeof event.metadata !== 'object') {
        return true;
      }
      const metadataObj = event.metadata as Record<string, any>;
      return !metadataObj.externalCalendarId;
    });
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Failed to fetch events needing sync', err, {
      userId,
    });
    return [];
  }
}

/**
 * Update calendar event with Google Calendar sync metadata
 */
export async function updateEventWithGoogleSync(
  eventId: string,
  externalCalendarId: string,
  lastSyncedAt: Date
) {
  try {
    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        metadata: {
          externalCalendarId,
          lastSyncedAt: lastSyncedAt.toISOString(),
          source: 'google',
        },
      },
    });

    logInfo('[GOOGLE_CALENDAR_SYNC] Event updated with Google Calendar ID', {
      eventId,
      externalCalendarId,
    });

    return { success: true, event };
  } catch (err) {
    logError('[GOOGLE_CALENDAR_SYNC] Failed to update event with Google sync', err, {
      eventId,
    });
    return { success: false };
  }
}
