import { google } from "googleapis";
import prisma from './prisma.js';
import { googleConfig } from '../config/env.js';

/**
 * Creates an authenticated Google OAuth2 client for a user.
 * @param userId - The ID of the user.
 * @returns An authenticated OAuth2 client or null if not configured.
 */
export async function getGoogleAuthClient(userId: string) {
  const googleAccount = await prisma.googleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount?.refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: googleAccount.refreshToken,
  });

  // Handle automatic token refresh for Google Calendar
  oauth2Client.on("tokens", async (newTokens) => {
    try {
      const current = await prisma.googleAccount.findUnique({ where: { userId } });
      if (!current) return;

      await prisma.googleAccount.update({
        where: { userId },
        data: {
          accessToken: newTokens.access_token || current.accessToken,
          refreshToken: newTokens.refresh_token || current.refreshToken,
          expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : current.expiresAt,
          updatedAt: new Date()
        }
      });
    } catch (err) {
      console.error("[GOOGLE CALENDAR] Token refresh save failed:", err);
    }
  });

  return oauth2Client;
}

/**
 * Creates an authenticated Google Calendar API client.
 * @param userId - The ID of the user.
 * @returns A Google Calendar API client instance or null.
 */
export async function getGoogleCalendarClient(userId: string) {
  const auth = await getGoogleAuthClient(userId);
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

/**
 * Fetches events from Google Calendar and syncs them to the local database.
 * @param userId - The ID of the user to sync events for.
 * @param calendar - An authenticated Google Calendar client instance.
 */
export async function syncGoogleCalendarEvents(userId: string, calendar: ReturnType<typeof google.calendar>) {
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30); // Sync events from the last 30 days
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 90); // And for the next 90 days

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items;
  if (!events || events.length === 0) {
    return { synced: 0, errors: [] };
  }

  let synced = 0;
  const errors: string[] = [];

  for (const event of events) {
    if (!event.id || !event.summary) continue;
    
    try {
      // Handle both all-day events and timed events
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      
      if (!startTime || !endTime) continue;

      const isAllDay = !event.start?.dateTime;
      const startAt = new Date(startTime);
      const endAt = new Date(endTime);

      // Use sourceId as unique identifier for Google events
      const sourceId = `google_${event.id}`;

      await prisma.calendarEvent.upsert({
        where: { id: sourceId },
        update: {
          title: event.summary,
          startAt,
          endAt,
          isAllDay,
          description: event.description || null,
          location: event.location || null,
          source: "google",
          updatedAt: new Date(),
        },
        create: {
          id: sourceId,
          title: event.summary,
          startAt,
          endAt,
          isAllDay,
          description: event.description || null,
          location: event.location || null,
          type: "event",
          source: "google",
          status: "scheduled",
          createdBy: userId,
          metadata: {
            googleEventId: event.id,
            googleCalendarId: "primary",
            htmlLink: event.htmlLink || null,
          },
        },
      });

      synced++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Failed to sync event ${event.id}: ${errorMsg}`);
      console.error(`[Calendar Sync] Error syncing event ${event.id}:`, error);
    }
  }

  // Update lastSyncedAt
  await prisma.googleAccount.updateMany({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  }).catch(() => {
    // Ignore if GoogleAccount doesn't exist yet
  });

  console.log(`[Calendar Sync] Synced ${synced} Google Calendar events for user ${userId}`);
  return { synced, errors };
}
