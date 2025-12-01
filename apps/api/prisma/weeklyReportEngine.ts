import { PrismaClient } from '@prisma/client';
import { computeHealthScore } from './healthScoreEngine';
import { generateActionPlan } from './weeklyActionPlan';

const prisma = new PrismaClient();

/**
 * Orchestrates the generation of a complete weekly report for a creator.
 * @param userId The ID of the creator.
 * @returns The ID of the newly created CreatorWeeklyReport record.
 */
export const generateWeeklyReport = async (userId: string): Promise<string> => {
  const weekEnd = new Date();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // 1. Compute Health Score
  const healthScore = await computeHealthScore(userId);

  // 2. Get last week's score to calculate change
  const lastReport = await prisma.creatorWeeklyReport.findFirst({
    where: { userId },
    orderBy: { weekEnd: 'desc' },
  });
  const lastWeekScore = lastReport?.healthScore ?? healthScore;
  const changeFromLastWeek = healthScore - lastWeekScore;

  // 3. Determine Grade and Risk Level
  let grade = 'C';
  if (healthScore > 85) grade = 'A';
  else if (healthScore > 70) grade = 'B';

  let riskLevel = 'low';
  if (healthScore < 40) riskLevel = 'high';
  else if (healthScore < 60) riskLevel = 'medium';

  // 4. Generate Action Plan
  const actionPlan = await generateActionPlan(healthScore, {});

  // 5. Mock AI Summary
  const aiSummary = `This week, your health score is ${healthScore}. You've shown strong engagement on your recent posts. Focus on the action plan to address key areas for improvement.`;

  // 6. Create the report in the database
  const newReport = await prisma.creatorWeeklyReport.create({
    data: {
      userId,
      weekStart,
      weekEnd,
      healthScore,
      grade,
      riskLevel,
      changeFromLastWeek,
      actionPlan,
      aiSummary,
      insights: {
        // In a real app, this would be populated by other services
        topPost: 'post_id_placeholder',
        followerChange: 150,
      },
    },
  });

  console.log(`Generated weekly report ${newReport.id} for user ${userId}`);
  return newReport.id;
};