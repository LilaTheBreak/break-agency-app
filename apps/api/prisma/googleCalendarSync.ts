/**
 * A stub for a Google Calendar API client.
 */
export const googleCalendarClient = {
  createEvent: async (eventData: any) => {
    console.log(`[GCal STUB] Pushing event "${eventData.summary}" to Google Calendar.`);
    return { id: `gcal_${Date.now()}` };
  },
};

export async function syncDealToGoogle(events: any[]) {
  for (const event of events) await googleCalendarClient.createEvent({ summary: event.title, start: { dateTime: event.startTime }, end: { dateTime: event.endTime } });
}