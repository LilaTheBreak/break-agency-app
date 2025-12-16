import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Mock Social Media API Clients
 */
const publishToTikTok = async (payload: any) => {
  console.log('Publishing to TikTok...');
  if (Math.random() > 0.8) throw new Error('TikTok API connection failed.');
  return { videoId: `tk_${Date.now()}` };
};
const publishToInstagram = async (payload: any) => {
  console.log('Publishing to Instagram...');
  return { postId: `ig_${Date.now()}` };
};

/**
 * Simulates an AI analyzing the best time to post.
 */
const analyzeOptimalTimes = (platform: string) => {
  const now = new Date();
  const optimalTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  optimalTime.setMinutes(0);
  optimalTime.setSeconds(0);

  return {
    time: optimalTime,
    score: 95,
    reason: `Based on recent engagement patterns on ${platform}, this time is projected to maximize initial reach.`,
  };
};

/**
 * Generates and saves a posting plan for a deliverable.
 */
export const generatePostingPlan = async (deliverableId: string) => {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) throw new Error('Deliverable not found.');

  const optimalTime = analyzeOptimalTimes(deliverable.platform);

  const schedule = await prisma.postingSchedule.create({
    data: {
      deliverableId,
      platform: deliverable.platform,
      scheduledAt: optimalTime.time,
      aiScore: optimalTime.score,
      payload: { caption: deliverable.caption },
      metadata: { recommendation: optimalTime.reason },
    },
  });

  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { aiPostingPlan: true },
  });

  return schedule;
};

/**
 * The core worker logic for finding and publishing due posts.
 */
export const runPostingSchedulerWorker = async () => {
  const now = new Date();
  const schedulesToRun = await prisma.postingSchedule.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
  });

  console.log(`Found ${schedulesToRun.length} posts to publish.`);

  for (const schedule of schedulesToRun) {
    await prisma.postingSchedule.update({
      where: { id: schedule.id },
      data: { attempts: { increment: 1 } },
    });

    try {
      let result;
      switch (schedule.platform.toUpperCase()) {
        case 'TIKTOK':
          result = await publishToTikTok(schedule.payload);
          break;
        case 'INSTAGRAM':
          result = await publishToInstagram(schedule.payload);
          break;
        default:
          throw new Error(`Unsupported platform for auto-posting: ${schedule.platform}`);
      }

      await prisma.postingSchedule.update({
        where: { id: schedule.id },
        data: {
          status: 'success',
          postedAt: new Date(),
          metadata: { ...((schedule.metadata as object) || {}), ...result },
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const newStatus = schedule.attempts + 1 >= schedule.maxAttempts ? 'failed' : 'scheduled'; // Keep as scheduled to retry

      await prisma.postingSchedule.update({
        where: { id: schedule.id },
        data: {
          status: newStatus,
          errorMessage,
          // If it failed permanently, maybe push back the schedule time
          scheduledAt: newStatus === 'scheduled' ? new Date(Date.now() + 60 * 60 * 1000) : schedule.scheduledAt,
        },
      });
    }
  }
};