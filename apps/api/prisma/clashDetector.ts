import type { TalentEvent } from '@prisma/client';

/**
 * Detects if a new event clashes with a list of existing events.
 * This is a logic-based service, not AI-based.
 * @param newEvent - The event to check.
 * @param existingEvents - An array of events to check against.
 * @returns An array of clashing event IDs.
 */
export function detectClashes(newEvent: TalentEvent, existingEvents: TalentEvent[]): string[] {
  const clashes: string[] = [];
  const newStartTime = new Date(newEvent.startTime).getTime();
  const newEndTime = new Date(newEvent.endTime).getTime();

  for (const existingEvent of existingEvents) {
    if (newEvent.id === existingEvent.id) continue;

    const existingStartTime = new Date(existingEvent.startTime).getTime();
    const existingEndTime = new Date(existingEvent.endTime).getTime();

    // Check for overlap
    if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
      clashes.push(existingEvent.id);
    }
  }

  return clashes;
}