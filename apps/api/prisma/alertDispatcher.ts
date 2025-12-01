import { PrismaClient, SocialPlatform } from '@prisma/client';

const prisma = new PrismaClient();

interface AlertPayload {
  title: string;
  description: string;
  actionPlan: any;
  impact: string;
}

/**
 * Dispatches an alert by saving it to the database and triggering notifications.
 * @param userId The user to alert.
 * @param platform The platform the alert relates to.
 * @param type The type of alert.
 * @param payload The composed alert data.
 */
export const dispatchAlert = async (userId: string, platform: SocialPlatform, type: string, payload: AlertPayload) => {
  // 1. Save the alert to the database
  const alert = await prisma.algorithmAlert.create({
    data: {
      userId,
      platform,
      type,
      ...payload,
    },
  });

  // 2. Trigger notifications (e.g., email, push, Slack)
  // if (alert.impact === 'high') {
  //   await emailQueue.add('send-high-impact-alert', { userId, alertId: alert.id });
  // }
};