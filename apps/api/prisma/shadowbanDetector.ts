import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates checking for signals of a shadowban or visibility limitation.
 * @param userId The ID of the user to check.
 * @returns A potential shadowban alert object.
 */
export const detectShadowban = async (userId: string) => {
  const recentPosts = await prisma.socialPost.findMany({
    where: { userId },
    orderBy: { postedAt: 'desc' },
    take: 3,
  });

  // Mock detection: If the latest post has unusually low engagement compared to others.
  if (recentPosts.length > 1 && (recentPosts[0].engagementRate || 0) < (recentPosts[1].engagementRate || 0) / 3) {
    return {
      banType: 'HASHTAG_SUPPRESSION',
      details: `Your recent posts show signs of hashtag suppression, with reach significantly lower than your average.`,
      impact: 'high',
      confidence: 0.75,
    };
  }

  return null;
};