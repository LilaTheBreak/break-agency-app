import prisma from '../../lib/prisma.js';
import { aiClient } from '../ai/aiClient.js';

const scoringPrompt = (context: {
  socials: any[];
  analytics: any;
  portfolio?: string;
}) => `
You are an AI Talent Scout for a top-tier creator agency. Your task is to evaluate a new creator based on their social media presence and portfolio to generate a "Content Quality" score and a "Deal Potential" score.

**Creator Context:**
- **Socials:** ${JSON.stringify(context.socials, null, 2)}
- **Analytics:** ${JSON.stringify(context.analytics, null, 2)}
- **UGC Portfolio URL:** ${context.portfolio || 'N/A'}

**Instructions:**
Analyze the provided data and return a structured JSON object with your scores and rationale.
1.  **contentQualityScore (0-100):** Evaluate the visual quality, editing, and creativity of their content. A high score means professional, high-effort content.
2.  **dealPotentialScore (0-100):** Based on their niche, engagement, and audience, estimate their potential to land brand deals. A high score means they are highly marketable.
3.  **brandFitScore (0-100):** How well do they fit with typical lifestyle, tech, and fashion brands?
4.  **followerQualityScore (0-100):** Based on engagement rate and velocity, how authentic and engaged does their audience seem?
5.  **rationale**: Provide a brief justification for your scores.

**JSON Output Schema:**
{
  "contentQualityScore": "number",
  "dealPotentialScore": "number",
  "brandFitScore": "number",
  "followerQualityScore": "number",
  "rationale": "string"
}
`;

/**
 * The main orchestrator for the creator scoring pipeline.
 * @param userId - The ID of the user to score.
 */
export async function scoreCreator(userId: string) {
  // 1. Fetch user + social accounts + analytics
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      socialAccounts: true,
      socialAnalytics: { orderBy: { capturedAt: 'desc' }, take: 1 },
    },
  });

  if (!user) throw new Error('User not found for scoring.');

  // 2. Evaluate using AI
  const aiResult = await aiClient.json(scoringPrompt({
    socials: user.socialAccounts,
    analytics: user.socialAnalytics[0] || {},
    portfolio: user.ugc_portfolio_url,
  })) as any;

  // 3. Calculate weighted score
  const weights = {
    engagementRate: 0.25,
    followerQuality: 0.20,
    contentQuality: 0.20,
    brandFit: 0.15,
    ugcPortfolio: 0.10,
    dealPotential: 0.10,
  };

  const engagementRate = user.socialAnalytics[0]?.engagementRate || 0;
  const ugcPortfolioScore = user.ugc_portfolio_url ? 80 : 30; // Simple binary score

  const finalScore =
    (engagementRate * 100 * weights.engagementRate) +
    (aiResult.followerQualityScore * weights.followerQuality) +
    (aiResult.contentQualityScore * weights.contentQuality) +
    (aiResult.brandFitScore * weights.brandFit) +
    (ugcPortfolioScore * weights.ugcPortfolio) +
    (aiResult.dealPotentialScore * weights.dealPotential);

  const score = Math.min(100, Math.round(finalScore));

  // 4. Assign role + roster_category
  let roster_category = 'none';
  let upgrade_suggested = false;
  let subscription_status = 'not_required';
  let createAdminTask = false;

  if (score >= 80) {
    roster_category = 'exclusive';
    createAdminTask = true;
  } else if (score >= 60) {
    roster_category = 'talent';
  } else if (score >= 40) {
    roster_category = 'ugc';
    subscription_status = 'required';
  } else {
    upgrade_suggested = true;
  }

  // 5. Update user record
  await prisma.user.update({
    where: { id: userId },
    data: {
      roster_category,
      upgrade_suggested,
      subscription_status,
      include_in_roster: score >= 60,
    },
  });

  await prisma.creatorScore.upsert({
    where: { userId },
    create: { userId, talentId: user.id, overallScore: score, summary: aiResult.rationale, rawScores: aiResult },
    update: { overallScore: score, summary: aiResult.rationale, rawScores: aiResult },
  });

  // 6. If upgrade_suggested → send email
  if (upgrade_suggested) {
    console.log(`[SCORING ENGINE] Sending upgrade suggestion email for user ${userId}.`);
    // In a real app: await sendEmail({ to: 'info@break.dev', ... });
  }

  // 7. If exclusive → create admin review task
  if (createAdminTask) {
    console.log(`[SCORING ENGINE] Creating admin review task for new Exclusive Talent: ${userId}.`);
    // In a real app: await prisma.task.create({ data: { title: `Review new Exclusive Talent: ${user.name}`, ... } });
  }

  console.log(`[SCORING ENGINE] User ${userId} scored ${score}. Assigned category: ${roster_category}.`);
  return { score, roster_category };
}