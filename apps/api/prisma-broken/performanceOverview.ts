import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generates a high-level performance overview for a creator.
 * In a real application, this would involve more complex aggregations and AI summarization.
 * @param userId The ID of the creator to analyze.
 * @returns A summary of the creator's key performance metrics.
 */
export const getPerformanceOverview = async (userId: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analytics = await prisma.socialAnalytics.findMany({
    where: {
      userId,
      capturedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { capturedAt: 'asc' },
  });

  if (analytics.length < 2) {
    return { summary: 'Not enough data for a 30-day overview.', followerGrowth: 0, avgEngagement: 0 };
  }

  const firstRecord = analytics[0];
  const lastRecord = analytics[analytics.length - 1];

  const followerGrowth = lastRecord.followerCount - firstRecord.followerCount;
  const avgEngagement = analytics.reduce((sum, record) => sum + (record.engagementRate || 0), 0) / analytics.length;

  // Mock AI Summary
  const summary = `Over the last 30 days, the creator has gained ${followerGrowth} followers and maintained an average engagement rate of ${avgEngagement.toFixed(2)}%. Their content performs best in the lifestyle category.`;

  return {
    summary,
    followerGrowth,
    avgEngagement: parseFloat(avgEngagement.toFixed(2)),
  };
};