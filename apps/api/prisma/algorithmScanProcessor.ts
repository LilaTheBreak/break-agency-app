import { Job } from 'bullmq';
import { PrismaClient, SocialPlatform } from '@prisma/client';
import { scanPlatform } from '../../services/ai/algorithm/platformScanner';
import { detectTrends } from '../../services/ai/algorithm/trendDetector';
import { detectShadowban } from '../../services/ai/algorithm/shadowbanDetector';
import { composeAlert } from '../../services/ai/algorithm/alertComposer';
import { dispatchAlert } from '../../services/ai/algorithm/alertDispatcher';

const prisma = new PrismaClient();

interface AlgoScanJobData {
  userId: string;
}

/**
 * Processes an algorithm scan job for a single user.
 */
export default async function algorithmScanProcessor(job: Job<AlgoScanJobData>) {
  const { userId } = job.data;
  console.log(`Running algorithm scan for userId: ${userId}`);

  try {
    const platforms: SocialPlatform[] = ['TIKTOK', 'INSTAGRAM'];

    for (const platform of platforms) {
      const platformChange = await scanPlatform(platform);
      if (platformChange) {
        const alert = composeAlert(platformChange);
        await dispatchAlert(userId, platform, 'PLATFORM_SHIFT', alert);
      }

      const trend = await detectTrends(userId, platform);
      if (trend) {
        const alert = composeAlert(trend);
        await dispatchAlert(userId, platform, 'TREND', alert);
      }
    }

    const shadowban = await detectShadowban(userId);
    if (shadowban) {
      const alert = composeAlert(shadowban);
      await dispatchAlert(userId, 'INSTAGRAM', 'SHADOWBAN_RISK', alert);
    }
  } catch (error) {
    console.error(`Failed to process algorithm scan for userId: ${userId}`, error);
    throw error;
  }
}