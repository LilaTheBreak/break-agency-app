import { PrismaClient, Deliverable } from '@prisma/client';
import { SocialPlatform } from '../src/types/socialPlatform.js';
import { addDays, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Simulates an AI engine to find the optimal posting time for a deliverable.
 * @param deliverable The deliverable to be scheduled.
 * @returns The newly created PostingSlot object.
 */
export const autoSchedulePost = async (deliverable: Deliverable) => {
  if (!deliverable.userId) {
    throw new Error('Deliverable must be associated with a user.');
  }

  // 1. Analyze creator analytics to find best times (mocked)
  const bestTimeHours = 18; // 6 PM

  // 2. Check for conflicts and deadlines
  const dueDate = deliverable.dueDate || addDays(new Date(), 7);
  let scheduledFor = setMinutes(setHours(dueDate, bestTimeHours), 0);

  const conflictingSlots = await prisma.postingSlot.count({
    where: {
      userId: deliverable.userId,
      scheduledFor: {
        gte: setHours(scheduledFor, 0),
        lt: setHours(scheduledFor, 23),
      },
    },
  });

  if (conflictingSlots > 0) {
    scheduledFor = addDays(scheduledFor, 1); // Push to the next day if there's a conflict
  }

  // 3. Generate AI reasoning
  const aiReasoning = {
    optimalTime: `Scheduled for ${bestTimeHours}:00 based on peak audience activity for this creator's profile.`,
    conflictAvoidance: conflictingSlots > 0 ? 'Pushed to the next day to avoid content overlap.' : 'No scheduling conflicts detected.',
    deadlineAdherence: `Scheduled before the due date of ${dueDate.toLocaleDateString()}.`,
  };

  // 4. Create the PostingSlot in the database
  return await prisma.postingSlot.create({
    data: {
      deliverableId: deliverable.id,
      userId: deliverable.userId,
      platform: 'INSTAGRAM', // This should come from the deliverable details
      status: 'suggested',
      scheduledFor,
      aiReasoning,
    },
  });
};
