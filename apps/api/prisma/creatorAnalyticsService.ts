import prisma from '../../lib/prisma.js';

/**
 * Fetches and summarizes key analytics for a creator's dashboard.
 * @param userId - The ID of the creator.
 */
export async function getCreatorAnalyticsSummary(userId: string) {
  // This is a simplified example. A real implementation would aggregate
  // data from SocialAnalytics, CreatorInsights, etc.
  const latestAnalytics = await prisma.socialAnalytics.findFirst({
    where: { userId },
    orderBy: { capturedAt: 'desc' },
  });

  const totalEarnings = await prisma.payout.aggregate({ where: { userId }, _sum: { amount: true } });

  return {
    followerCount: latestAnalytics?.followerCount || 0,
    engagementRate: latestAnalytics?.engagementRate || 0,
    totalEarnings: totalEarnings._sum.amount || 0,
  };
}