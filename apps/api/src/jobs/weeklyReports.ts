import prisma from '../lib/prisma.js';
import { generateCreatorInsights } from '../services/insightService.js';
import { sendTemplatedEmail } from '../services/email/emailClient.js';

export async function generateWeeklyReports() {
  // TODO: CreatorWeeklyReport model not yet implemented in schema
  console.warn('[Weekly Reports] Skipped: CreatorWeeklyReport model not available');
  return;
  
  /* DISABLED UNTIL MODEL ADDED
  const users = await prisma.user.findMany();

  for (const user of users) {
    const insights = await generateCreatorInsights(user.id);

    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 1000 * 60 * 60 * 24 * 7);

    // await prisma.creatorWeeklyReport.create({
    //   data: {
    //     userId: user.id,
    //     weekStart,
    //     weekEnd,
    //     insights: insights ? (insights as any) : null,
    //     aiSummary: insights?.summary || ""
    //   }
    // });

    if (user.email) {
      await sendTemplatedEmail({
        to: user.email,
        subject: "Your Weekly Creator Performance Report",
        template: "weeklyReport",
        metadata: {
          summary: insights?.summary || "",
          opportunities: insights?.opportunities || "",
          contentIdeas: insights?.contentIdeas || []
        }
      }).catch(() => null);
    }
  }
  */
}
