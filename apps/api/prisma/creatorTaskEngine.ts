import prisma from '../../lib/prisma.js';

/**
 * Scans for actionable items and creates tasks for the creator.
 * This would be run by a cron job.
 */
export async function runDailyCreatorSweep(userId: string) {
  console.log(`[CREATOR TASK ENGINE] Running daily sweep for user ${userId}...`);

  // 1. Find overdue deliverables
  const overdueDeliverables = await prisma.deliverable.findMany({
    where: { userId, status: { not: 'delivered' }, dueDate: { lt: new Date() } },
  });

  for (const deliverable of overdueDeliverables) {
    await createTask({
      userId,
      taskType: 'RECORD_VIDEO', // Simplified type
      title: `Overdue: ${deliverable.title}`,
      dueDate: deliverable.dueDate,
      metadata: { deliverableId: deliverable.id },
    });
  }

  // 2. Find high-priority emails needing a reply
  const highPriorityEmails = await prisma.inboundEmail.findMany({
    where: { userId, aiPriority: { gte: 8 }, isAwaitingReply: false }, // Assuming higher is more important
  });

  for (const email of highPriorityEmails) {
    await createTask({
      userId,
      taskType: 'REPLY_EMAIL',
      title: `Reply to: ${email.subject}`,
      metadata: { emailId: email.id },
    });
  }

  console.log(`[CREATOR TASK ENGINE] Sweep complete. Found ${overdueDeliverables.length} overdue deliverables and ${highPriorityEmails.length} priority emails.`);
}

/**
 * Creates a new task for a creator if it doesn't already exist.
 */
async function createTask(taskData: any) {
  const existingTask = await prisma.creatorTask.findFirst({
    where: { userId: taskData.userId, title: taskData.title },
  });

  if (!existingTask) {
    await prisma.creatorTask.create({ data: taskData });
  }
}