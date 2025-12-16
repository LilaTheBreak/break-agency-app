import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates a "health score" for a creator based on recent activity.
 * This is a mock implementation. A real version would use more sophisticated metrics.
 * @param userId The ID of the creator.
 * @returns A score from 0-100.
 */
export const computeHealthScore = async (userId: string): Promise<number> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPostsCount = await prisma.socialPost.count({
    where: { userId, postedAt: { gte: thirtyDaysAgo } },
  });

  const overdueDeliverables = await prisma.deliverable.count({
    where: { userId, status: { not: 'delivered' }, dueDate: { lt: new Date() } },
  });

  // Simple scoring logic: more posts are good, overdue items are bad.
  let score = 50;
  score += recentPostsCount * 2; // Add 2 points for each post in the last 30 days
  score -= overdueDeliverables * 10; // Subtract 10 points for each overdue deliverable

  return Math.max(0, Math.min(100, score)); // Clamp score between 0 and 100
};