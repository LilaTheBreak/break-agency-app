import prisma from '../../lib/prisma.js';
import { getTemplateForType } from './utils/timelineTemplates.js';
import { syncToGoogleCalendar } from './calendarSyncService.js';
import { sendPushNotification } from '../notifications/pushService.js';

function addWorkingDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  let addedDays = 0;
  while (addedDays < days) {
    newDate.setDate(newDate.getDate() + 1);
    const dayOfWeek = newDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
      addedDays++;
    }
  }
  return newDate;
}

/**
 * Generates a detailed, step-by-step timeline for a single deliverable.
 * @param deliverableId - The ID of the deliverable.
 */
export async function generateTimelineForDeliverable(deliverableId: string) {
  const deliverable = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
  if (!deliverable) throw new Error('Deliverable not found.');

  // 1. Get the appropriate template
  const stepsTemplate = getTemplateForType(deliverable.title); // Simplified: using title as type

  // 2. Fetch creator's existing events to check for conflicts
  const existingEvents = await prisma.talentEvent.findMany({
    where: { userId: deliverable.userId! },
  });

  const timelineSteps = [];
  let currentStartDate = new Date(); // Start from today

  // 3. Build steps and estimate dates
  for (const step of stepsTemplate) {
    let startDate = addWorkingDays(currentStartDate, 0); // Ensure start is a weekday
    let endDate = addWorkingDays(startDate, step.duration);

    // 4. Conflict Resolution (simplified)
    let conflict = true;
    while (conflict) {
      conflict = existingEvents.some(e =>
        new Date(e.startTime) < endDate && new Date(e.endTime) > startDate
      );
      if (conflict) {
        console.log(`[TIMELINE ENGINE] Conflict detected for step "${step.step}". Shifting by 1 day.`);
        startDate = addWorkingDays(startDate, 1);
        endDate = addWorkingDays(endDate, 1);
      }
    }

    timelineSteps.push({
      deliverableId,
      step: step.step,
      startDate,
      endDate,
      aiNotes: `Estimated ${step.duration} working days.`,
    });

    currentStartDate = endDate; // Next step starts after the previous one ends
  }

  // 5. Save the generated timeline to the database
  await prisma.deliverableTimeline.deleteMany({ where: { deliverableId } }); // Clear old timeline
  await prisma.deliverableTimeline.createMany({ data: timelineSteps });

  console.log(`[TIMELINE ENGINE] Generated ${timelineSteps.length} steps for deliverable ${deliverableId}.`);

  // 6. Sync the new timeline to external calendars
  const calendarEvents = timelineSteps.map(step => ({
    title: `${deliverable.title}: ${step.step}`,
    startDate: step.startDate,
    endDate: step.endDate,
  }));
  await syncToGoogleCalendar(calendarEvents, deliverable.userId!);

  // 7. Send notification
  await sendPushNotification({
    to: 'user_push_token', // Fetch from user's profile
    title: 'New Timeline Generated!',
    body: `Your AI assistant has created a timeline for "${deliverable.title}".`,
  });

  return timelineSteps;
}