import prisma from '../../lib/prisma.js';

/**
 * Schedules reminders for overdue deliverables.
 * In a real app, this would queue emails or other notifications.
 * @param overdueDeliverables - An array of deliverable objects that are overdue.
 */
export async function scheduleRemindersForOverdue(overdueDeliverables: any[]) {
  if (overdueDeliverables.length === 0) return;

  console.log(`[REMINDER ENGINE] Scheduling ${overdueDeliverables.length} reminders for overdue deliverables.`);

  for (const deliverable of overdueDeliverables) {
    // Placeholder for queuing an email
    await prisma.emailLog.create({
      data: {
        to: 'talent@example.com', // This would be the talent's actual email
        subject: `Reminder: Deliverable "${deliverable.title}" is overdue`,
        template: 'deliverable_reminder',
        metadata: { deliverableId: deliverable.id },
      },
    });
  }
}