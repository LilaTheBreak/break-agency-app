import prisma from '../../lib/prisma.js';
import { trackDeliverables } from './deliverableTracker.js';
import { scheduleRemindersForOverdue } from '../notifications/reminderEngine.js';

async function detectRisks(campaignId: string) {
  // Placeholder for risk detection logic
  console.log(`[WORKFLOW] Detecting risks for campaign ${campaignId}...`);
  const risks = [];
  // Example: check if too many deliverables are due soon
  const { dueSoon } = await trackDeliverables(campaignId);
  if (dueSoon.length > 3) {
    risks.push({ type: 'SCHEDULING_PRESSURE', message: `${dueSoon.length} deliverables are due in the next 3 days.` });
  }
  return risks;
}

/**
 * Runs hourly checks for a specific campaign.
 * @param campaignId - The ID of the campaign to check.
 */
export async function runHourlyChecks(campaignId: string) {
  console.log(`[WORKFLOW] Running hourly checks for campaign ${campaignId}...`);

  // 1. Update statuses based on deliverable tracker
  const { overdue, summary } = await trackDeliverables(campaignId);

  // 2. Schedule reminders for anything that's overdue
  await scheduleRemindersForOverdue(overdue);

  // 3. Detect and save risks
  const risks = await detectRisks(campaignId);
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { riskSummary: { risks, lastChecked: new Date(), deliverableStatus: summary } },
  });
}

/**
 * Runs the daily workflow for all active campaigns.
 */
export async function runDailyWorkflow() {
  console.log('[WORKFLOW] Running daily workflow for all active campaigns...');
  const activeCampaigns = await prisma.campaign.findMany({
    where: { stage: 'ACTIVE' },
  });

  for (const campaign of activeCampaigns) {
    // The daily workflow could include more in-depth analysis or reporting
    // For now, it will run the same checks as the hourly one.
    await runHourlyChecks(campaign.id).catch(err =>
      console.error(`[WORKFLOW] Daily check failed for campaign ${campaign.id}:`, err)
    );
  }
}