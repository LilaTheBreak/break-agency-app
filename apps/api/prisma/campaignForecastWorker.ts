import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { generateCampaignForecast } from '../../services/ai/campaignForecastService';

const prisma = new PrismaClient();

/**
 * Worker processor that finds pending briefs and generates AI forecasts for them.
 * This would be triggered by a cron job.
 */
export default async function campaignForecastWorker(job: Job) {
  console.log('Running Campaign Forecast Worker...');
  try {
    const briefsWithoutForecasts = await prisma.brandBrief.findMany({
      where: { forecast: null },
    });

    console.log(`Found ${briefsWithoutForecasts.length} briefs needing a forecast.`);

    for (const brief of briefsWithoutForecasts) {
      await generateCampaignForecast(brief.id);
      console.log(`Generated forecast for brief ${brief.id}`);
      // Optionally send a notification to the brand user
    }
  } catch (error) {
    console.error('Campaign Forecast Worker failed:', error);
    throw error;
  }
}