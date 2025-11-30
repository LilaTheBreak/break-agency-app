import prisma from '../../lib/prisma.js';
import { collectTalentData } from './talentDataCollector.js';
import { predictPerformance } from './performancePredictor.js';
import { aiClient } from '../ai/aiClient.js';

const fitScorePrompt = (context: any) => `
Analyze the fit between a creator and a campaign plan. Score the fit from 0 to 100 based on category match, audience demographics, creative alignment, and brand safety.

**Campaign Plan:**
${JSON.stringify(context.plan, null, 2)}

**Creator Profile:**
${JSON.stringify(context.talent.user.personaProfile, null, 2)}

**JSON Output Schema:**
{ "fitScore": "number", "reasoning": ["string"] }
`;

/**
 * Orchestrates the entire talent shortlisting process for a campaign plan.
 * @param aiPlanId - The ID of the CampaignAIPlan.
 */
export async function runTalentShortlist(aiPlanId: string) {
  const plan = await prisma.campaignAIPlan.findUnique({ where: { id: aiPlanId } });
  if (!plan) throw new Error('Campaign AI Plan not found.');

  // 1. Find all available talents
  const allTalents = await prisma.talent.findMany();
  const matchResults = [];

  // 2. Score each talent against the plan
  for (const talent of allTalents) {
    const talentData = await collectTalentData(talent.id);
    if (!talentData) continue;

    // a. Get AI Fit Score
    const { fitScore, reasoning } = await scoreTalentFit(plan, talentData);

    // b. Predict Performance
    const performance = await predictPerformance({
      talentAnalytics: talentData.user.socialAnalytics[0],
      campaignBrief: plan,
    });

    // c. Predict Fee (simplified)
    const predictedFee = talentData.pricingModels[0]?.baseRate || 5000;

    matchResults.push({
      aiPlanId,
      talentId: talent.id,
      fitScore,
      predictedKPIs: performance,
      predictedFee,
      reasoning,
    });
  }

  // 3. Rank the results
  matchResults.sort((a, b) => b.fitScore - a.fitScore);
  const rankedResults = matchResults.map((result, index) => ({ ...result, rank: index + 1 }));

  // 4. Save results to the database
  await prisma.creatorMatchResult.deleteMany({ where: { aiPlanId } });
  await prisma.creatorMatchResult.createMany({
    data: rankedResults,
  });

  console.log(`[MATCH ENGINE] Generated shortlist of ${rankedResults.length} creators for plan ${aiPlanId}.`);
  return rankedResults;
}

/**
 * Uses AI to score the fit between a plan and a single talent.
 */
async function scoreTalentFit(plan: any, talent: any) {
  try {
    const prompt = fitScorePrompt({ plan, talent });
    return await aiClient.json(prompt) as { fitScore: number; reasoning: string[] };
  } catch (error) {
    console.error('[AI FIT SCORE ERROR]', error);
    return { fitScore: 50, reasoning: ['AI offline (stub)'] };
  }
}