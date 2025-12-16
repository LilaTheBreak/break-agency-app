import { google } from "googleapis";
import prisma from "./prisma.js";
import { googleConfig } from "../config/env.js";

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
  const talent = await prisma.talent.findUnique({ where: { userId } });
  if (!talent) return;

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
    return;
  }

  for (const event of events) {
    if (!event.id || !event.summary || !event.start?.dateTime || !event.end?.dateTime) continue;

    await prisma.talentEvent.upsert({
      where: { sourceId: event.id }, // Use a unique field from the source to prevent duplicates
      update: {
        title: event.summary,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        description: event.description,
        location: event.location,
      },
      create: {
        talentId: talent.id,
        title: event.summary,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        description: event.description,
        location: event.location,
        source: "google_calendar",
        sourceId: event.id,
      },
    });
  }
}
