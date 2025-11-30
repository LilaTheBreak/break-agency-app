import { PrismaClient, User, RosterCategory, SubscriptionStatus } from '@prisma/client';
// import { emailQueue } from '../queues/emailQueue'; // Assuming an email queue exists

const prisma = new PrismaClient();

/**
 * Mock email queue for demonstration.
 */
const emailQueue = {
  add: async (name: string, data: any) => {
    console.log(`[EmailQueue] Job '${name}' added with data:`, data);
  },
};

/**
 * Calculates a composite score for a creator based on their social data.
 * This is a mock implementation. A real version would involve more complex logic.
 * @param userId The ID of the user to score.
 * @returns An object containing the final score and the reasons behind it.
 */
export async function calculateCreatorScore(userId: string): Promise<{ score: number; reasons: any }> {
  // 1. Pull SocialAnalytics and SocialPosts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analytics = await prisma.socialAnalytics.findMany({
    where: { userId, capturedAt: { gte: thirtyDaysAgo } },
    orderBy: { capturedAt: 'desc' },
  });

  const posts = await prisma.socialPost.findMany({
    where: { userId },
    orderBy: { postedAt: 'desc' },
    take: 10,
  });

  // 2. Evaluate sub-scores (mock logic)
  const reasons = {
    inboundIntentScore: 75, // Placeholder
    contentQualityScore: posts.reduce((acc, p) => acc + (p.engagementRate || 0), 0) > 0.5 ? 80 : 50,
    postingVelocityScore: posts.length > 5 ? 85 : 40,
    nicheStrengthScore: 70, // Placeholder
    portfolioScore: 60, // Placeholder
    marketabilityScore: 78, // Placeholder
  };

  // 3. Calculate final score (weighted average)
  const score = Math.round(
    (reasons.inboundIntentScore * 0.1) +
    (reasons.contentQualityScore * 0.3) +
    (reasons.postingVelocityScore * 0.2) +
    (reasons.nicheStrengthScore * 0.2) +
    (reasons.portfolioScore * 0.1) +
    (reasons.marketabilityScore * 0.1)
  );

  return { score, reasons };
}

/**
 * Classifies a creator and updates their profile based on the calculated score.
 * @param userId The ID of the user to classify.
 * @param score The user's calculated score.
 * @param reasons The reasoning behind the score.
 * @returns The final category assigned to the creator.
 */
export async function classifyCreator(userId: string, score: number, reasons: any): Promise<RosterCategory> {
  let roster_category: RosterCategory;
  let upgrade_suggested = false;
  let subscription_status: SubscriptionStatus = 'FREE';

  if (score >= 70) {
    roster_category = 'EXCLUSIVE'; // Exclusive Talent Consideration
    upgrade_suggested = true;
    subscription_status = 'PREMIUM';
  } else if (score >= 40) {
    roster_category = 'TALENT';
    upgrade_suggested = true;
    subscription_status = 'PREMIUM';
  } else {
    roster_category = 'UGC'; // UGC Creator
    subscription_status = 'UGC_PAID';
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      creator_score: score,
      creator_score_reason: reasons,
      roster_category,
      upgrade_suggested,
      subscription_status,
    },
  });

  return roster_category;
}

/**
 * Sends an email notification if an upgrade is suggested for the creator.
 * @param user The user who was scored.
 * @param score The user's score.
 * @param category The category they were placed in.
 * @param reasons The reasoning for the score.
 */
export async function sendUpgradeEmail(user: User, score: number, category: RosterCategory, reasons: any) {
  if (!user.upgrade_suggested) {
    return;
  }

  await emailQueue.add('creator-upgrade-suggestion', {
    to: user.email,
    subject: `You're a great fit for our ${category} Roster!`,
    template: 'upgradeSuggestion',
    context: {
      name: user.name,
      score,
      category,
      reasons,
    },
  });
}