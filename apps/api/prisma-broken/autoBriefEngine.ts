import prisma from '../../lib/prisma.js';
import { aiClient } from '../ai/aiClient.js';

const briefPrompt = (context: any) => `
You are a world-class campaign strategist. Based on the provided deal draft and creator profile, generate a comprehensive campaign brief and strategy.

**Deal Draft:**
${JSON.stringify(context.dealDraft, null, 2)}

**Creator Profile:**
${JSON.stringify(context.creatorProfile, null, 2)}

**Instructions:**
Generate a full campaign plan.
- **aiSummary**: A one-paragraph executive summary of the campaign.
- **deliverables**: A list of specific content pieces to be created.
- **strategy**: Include platform mix, creative directions, and a high-level timeline.
- **audience**: Describe the target audience for this campaign.
- **budget**: Provide an estimated budget breakdown based on the deliverables.
- **risks**: Identify 2-3 potential risks for this campaign.
- **talent**: Justify why this creator is a good fit.

**JSON Output Schema:**
{
  "aiSummary": "string",
  "deliverables": [{ "type": "string", "platform": "string", "quantity": "number", "notes": "string" }],
  "strategy": { "platformMix": "string", "creativeDirections": ["string"], "timeline": "string" },
  "audience": "string",
  "budget": { "total": "number", "breakdown": [{ "item": "string", "cost": "number" }] },
  "risks": ["string"],
  "talent": { "justification": "string" }
}
`;

/**
 * Generates a full AI-powered campaign brief and strategy from a deal draft.
 * @param dealDraftId - The ID of the DealDraft.
 */
export async function generateAutoBrief(dealDraftId: string) {
  // 1. Load context
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: { include: { personaProfile: true } } },
  });
  if (!dealDraft) throw new Error('Deal draft not found.');

  const context = {
    dealDraft: {
      brand: dealDraft.brand,
      offerValue: dealDraft.offerValue,
      initialDeliverables: dealDraft.deliverables,
    },
    creatorProfile: dealDraft.user.personaProfile,
  };

  // 2. Generate plan with AI
  let plan;
  try {
    plan = await aiClient.json(briefPrompt(context));
  } catch (error) {
    console.error('[AI AUTOBRIEF ERROR]', error);
    // Return a stub on failure
    plan = { aiSummary: 'AI is offline. This is a stubbed summary.', deliverables: [], strategy: {}, audience: '', budget: {}, risks: [], talent: {} };
  }

  // 3. Save to database
  const result = await prisma.campaignAIPlan.upsert({
    where: { dealDraftId },
    create: { dealDraftId, brandName: dealDraft.brand, ...plan },
    update: { ...plan },
  });

  console.log(`[AUTO-BRIEF] Generated plan ${result.id} for deal draft ${dealDraftId}.`);
  return result;
}