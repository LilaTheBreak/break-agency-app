import prisma from '../lib/prisma';

export interface ConflictResult {
  hasConflict: boolean;
  conflictingEvents: Array<{
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    type: string;
  }>;
  conflicts: string[];
}

/**
 * Checks if a new calendar event conflicts with existing events for a user.
 * 
 * @param userId - The user ID to check conflicts for
 * @param startAt - Start time of the new event
 * @param endAt - End time of the new event
 * @param excludeEventId - Optional event ID to exclude from conflict check (for updates)
 * @returns ConflictResult with conflict information
 */
export async function checkEventConflicts(
  userId: string,
  startAt: Date,
  endAt: Date,
  excludeEventId?: string
): Promise<ConflictResult> {
  const conflictingEvents: ConflictResult["conflictingEvents"] = [];
  const conflicts: string[] = [];

  // Find all events for this user that overlap with the new event time range
  const overlappingEvents = await prisma.calendarEvent.findMany({
    where: {
      createdBy: userId,
      status: { not: "cancelled" }, // Don't check cancelled events
      id: excludeEventId ? { not: excludeEventId } : undefined,
      // Overlap condition: newStart < existingEnd AND newEnd > existingStart
      AND: [
        { startAt: { lt: endAt } },
        { endAt: { gt: startAt } },
      ],
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      type: true,
      location: true,
      isAllDay: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });

  for (const event of overlappingEvents) {
    conflictingEvents.push({
      id: event.id,
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      type: event.type,
    });

    const eventStart = event.startAt.toLocaleString();
    const eventEnd = event.endAt.toLocaleString();
    conflicts.push(
      `Conflicts with "${event.title}" (${eventStart} - ${eventEnd})`
    );
  }

  return {
    hasConflict: conflictingEvents.length > 0,
    conflictingEvents,
    conflicts,
  };
}

/**
 * Checks if a user is available during a given time range.
 * 
 * @param userId - The user ID to check availability for
 * @param startAt - Start time of the requested slot
 * @param endAt - End time of the requested slot
 * @param excludeEventId - Optional event ID to exclude from availability check
 * @returns true if available, false if conflicts exist
 */
export async function checkAvailability(
  userId: string,
  startAt: Date,
  endAt: Date,
  excludeEventId?: string
): Promise<boolean> {
  const conflictResult = await checkEventConflicts(userId, startAt, endAt, excludeEventId);
  return !conflictResult.hasConflict;
}

/**
 * Gets all conflicting events for a user within a time range.
 * Useful for displaying conflicts in the UI.
 * 
 * @param userId - The user ID
 * @param startAt - Start of time range
 * @param endAt - End of time range
 * @returns Array of conflicting events
 */
export async function getConflictingEvents(
  userId: string,
  startAt: Date,
  endAt: Date
): Promise<ConflictResult["conflictingEvents"]> {
  const result = await checkEventConflicts(userId, startAt, endAt);
  return result.conflictingEvents;
}

