import prisma from '../../lib/prisma.js';
import { buildTimeline } from './timelineBuilder.js';
import { createInternalEvents } from './calendarSyncService.js';
import { syncDealToGoogle } from './googleCalendarSync.js';

/**
 * The main orchestrator for the auto-scheduling pipeline.
 * @param dealId - The ID of the DealThread to schedule.
 */
export async function autoScheduleDeal(dealId: string) {
  // 1. Fetch deal and deliverables
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: { deliverables: true, user: { include: { talents: true } } },
  });

  if (!deal || !deal.user || deal.deliverables.length === 0) {
    throw new Error('Deal, user, or deliverables not found for scheduling.');
  }

  // 2. Build the timeline
  const { timeline } = buildTimeline(deal.deliverables);

  // 3. Create internal calendar events
  const talentId = deal.user.talents[0].id;
  const events = await createInternalEvents(timeline, talentId, deal.userId!);

  // 4. (Optional) Sync to Google Calendar
  await syncDealToGoogle(events);

  console.log(`[AUTO-SCHEDULER] Successfully scheduled ${events.length} events for deal ${dealId}.`);
  return { timeline, events };
}