import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Finds old, un-actioned AI campaign plans and sends a reminder.
 * This would be run on a schedule (e.g., daily).
 */
export const sendCampaignPlanReminders = async () => {
  console.log('Running campaign plan reminder job...');

  const sevenDaysAgo = subDays(new Date(), 7);

  const oldPlans = await prisma.campaignAutoPlan.findMany({
    where: {
      createdAt: { lt: sevenDaysAgo },
      // Add a status field to check if it's been converted
      // status: 'pending_review',
    },
    include: { user: true },
  });

  for (const plan of oldPlans) {
    console.log(`Sending reminder to ${plan.user.email} for plan ${plan.id}.`);
    // In a real app, you would queue an email here:
    // await emailQueue.add('send-reminder', { to: plan.user.email, planId: plan.id });
  }

  console.log(`Sent ${oldPlans.length} reminders.`);
};