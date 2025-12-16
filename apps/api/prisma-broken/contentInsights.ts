import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Provides actionable insights based on a creator's recent content.
 * @param userId The ID of the creator to analyze.
 * @returns An object with content insights and suggestions.
 */
export const getContentInsights = async (userId: string) => {
  const posts = await prisma.socialPost.findMany({
    where: { userId },
    take: 10,
    orderBy: { postedAt: 'desc' },
  });

  // Mock insight generation
  const insights = {
    topPerformingPost: posts[0]?.id || null,
    bestTimeToPost: 'Weekdays at 6 PM',
    topHashtags: ['#fashion', '#ootd', '#style'],
    suggestions: [
      'Collaborate with other creators in the fashion niche.',
      'Create more "Get Ready With Me" (GRWM) style videos.',
      'Experiment with Instagram Reels to increase reach.',
    ],
  };

  return insights;
};