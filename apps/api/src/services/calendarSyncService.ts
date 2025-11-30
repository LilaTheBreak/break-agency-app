type CalendarSyncPayload = {
  userId: string;
  type: string;
  title: string;
  date: Date;
  metadata?: Record<string, any>;
};

// Placeholder calendar sync. Extend with real calendar integration when available.
export async function syncCalendarEvent(_payload: CalendarSyncPayload) {
  return true;
}
