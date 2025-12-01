import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analyzes a creator's performance across different content categories.
 * @param userId The ID of the creator to analyze.
 * @returns An object containing performance metrics for each category.
 */
export const getCategoryBenchmarks = async (userId: string) => {
  const posts = await prisma.socialPost.findMany({
    where: { userId },
    take: 50,
    orderBy: { postedAt: 'desc' },
  });

  // Mock category analysis
  const categoryPerformance = {
    lifestyle: { engagement: 3.5, views: 50000 },
    fashion: { engagement: 4.2, views: 75000 },
    tech: { engagement: 2.8, views: 30000 },
  };

  const summary = `The creator's content performs strongest in the 'Fashion' category, with the highest engagement and views. 'Lifestyle' content is also strong, while 'Tech' shows lower performance.`;

  return {
    categoryPerformance,
    summary,
    bestCategory: 'fashion',
  };
};