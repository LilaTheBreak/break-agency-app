import prisma from '../../lib/prisma.js';

/**
 * Creates internal `TalentEvent` records from a generated timeline.
 * @param timeline - The structured timeline from the timelineBuilder.
 * @param talentId - The ID of the talent.
 * @param userId - The ID of the user.
 */
export async function createInternalEvents(timeline: any[], talentId: string, userId: string) {
  console.log(`[CALENDAR SYNC] Creating ${timeline.length} internal calendar events.`);
  const events = [];
  for (const item of timeline) {
    const event = await prisma.talentEvent.create({
      data: {
        userId,
        title: item.title,
        startTime: item.startDate,
        endTime: item.endDate,
        source: 'deal_schedule',
        sourceId: item.deliverableId,
      },
    });
    // Link the event back to the deliverable
    await prisma.deliverableItem.update({ where: { id: item.deliverableId }, data: { calendarEventId: event.id } });
    events.push(event);
  }
  return events;
}