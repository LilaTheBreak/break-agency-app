import prisma from '../lib/prisma.js';
import { runCampaignLLM } from './ai/campaignLLM.js';
import * as campaignBuilderService from './campaignBuilderService.js';
import * as campaignForecastService from './campaignForecastService.js';
import * as creativeDirectionService from './creativeDirectionService.js';
import * as contentStrategyService from './contentStrategyService.js';
import * as campaignDeliverableService from './campaignDeliverableService.js';
import * as storyboardService from './storyboardService.js';
import * as hashtagService from './hashtagService.js';
import * as postingSchedulerService from './postingSchedulerService.js';

interface AutoPlanInput {
  dealId?: string;
  briefId?: string;
  userId: string;
  preview?: boolean;
  debug?: boolean;
}

/**
 * Orchestrates the automatic generation of a complete campaign plan.
 * @param input - The deal or brief ID to base the plan on.
 * @returns A comprehensive campaign plan.
 */
export async function autoPlanCampaign(input: AutoPlanInput) {
  const { dealId, briefId, userId } = input;

  let brief: any;
  let deal: any;
  let brand: any;
  let talent: any;

  if (dealId) {
    deal = await prisma.deal.findUnique({ where: { id: dealId }, include: { Talent: true, Brand: true } });
    if (!deal) throw new Error("Deal not found.");
    // REMOVED: BrandBrief model does not exist
    // Campaign plan generation currently only works with deal data
    brief = null;
    brand = deal.Brand;
    talent = deal.Talent;
  } else if (briefId) {
    // Phase 5: BrandBrief model now exists
    brief = await prisma.brandBrief.findUnique({ 
      where: { id: briefId }
    });
    if (!brief) throw new Error("Brief not found.");
    // BrandBrief has brandId but we need to fetch brand separately
    const brandRecord = await prisma.brand.findUnique({
      where: { id: brief.brandId }
    });
    brand = brandRecord;
    // Note: Briefs don't have direct talent association, would need to match
    talent = null;
  } else {
    throw new Error("Either dealId or briefId must be provided.");
  }

  if (!brand || !talent) {
    throw new Error("Insufficient data to generate campaign plan (missing brand or talent).");
  }

  const llmInput = { brief, brandProfile: brand, talentProfile: talent };

  // Generate all components concurrently
  const [
    concepts,
    deliverables,
    timeline,
    forecast,
    creativeDirection,
    storyboard,
    hashtags,
    postingSchedule,
  ] = await Promise.all([
    runCampaignLLM(llmInput, "generate_concepts").then(res => res.data.concepts),
    campaignDeliverableService.generateCampaignDeliverables(llmInput),
    runCampaignLLM(llmInput, "generate_timeline").then(res => res.data.timeline),
    campaignForecastService.generateCampaignForecast(llmInput),
    creativeDirectionService.generateCreativeDirection(llmInput),
    storyboardService.generateStoryboard(llmInput),
    hashtagService.generateHashtags(llmInput),
    postingSchedulerService.generatePostingSchedule(llmInput),
  ]);

  // Create/Update the BrandCampaign record
  const campaignId = (brief as any)?.campaignId || `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const campaign = await prisma.brandCampaign.upsert({
    where: { id: campaignId },
    update: {
      stage: "PLANNING",
      metadata: {
        timeline, forecast, creativeDirection, hashtags, postingSchedule, concepts, deliverables, storyboard
      },
      updatedAt: new Date()
    },
    create: {
      id: campaignId,
      ownerId: userId,
      title: `Auto-Plan for ${brand?.name || "Campaign"}`,
      stage: "PLANNING",
      metadata: {
        timeline, forecast, creativeDirection, hashtags, postingSchedule, concepts, deliverables, storyboard
      },
      updatedAt: new Date()
    }
  });

  return { campaignId: campaign.id, concepts, deliverables, timeline, forecast, creativeDirection, storyboard, hashtags, postingSchedule };
}