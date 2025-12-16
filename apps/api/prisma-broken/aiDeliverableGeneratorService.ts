import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const planGeneratorPrompt = (context: { rawText: string; creatorPricing: any }) => `
You are an expert agency producer who excels at turning unstructured client emails into actionable project plans.

**Creator's Standard Pricing:**
${JSON.stringify(context.creatorPricing, null, 2)}

**Inbound Email/Brief Text:**
---
${context.rawText}
---

**Instructions:**
Analyze the text and generate a complete, structured project plan.
1.  **inferDeliverables**: List each distinct deliverable requested (e.g., "2x Instagram Reels", "1x YouTube Integration").
2.  **inferTimeline**: Identify any key dates or deadlines mentioned. If none, propose a realistic timeline.
3.  **inferRounds**: How many rounds of revisions are mentioned or implied? Default to 2 if unspecified.
4.  **inferUsageRights**: Summarize the requested usage rights (duration, channels, territory).
5.  **estimateFees**: Based on the deliverables and usage, provide a fee estimate range (min, max) using the creator's pricing.
6.  **inferContentBriefs**: For each deliverable, write a one-sentence creative brief.
7.  **generateSummaryMarkdown**: Create a markdown-formatted summary of the entire proposed plan.

**JSON Output Schema:**
{
  "aiDeliverablePlan": [
    { "type": "string", "platform": "string", "quantity": "number" }
  ],
  "aiTimeline": { "summary": "string", "keyDates": [{ "date": "ISO_8601_Date", "event": "string" }] },
  "aiRounds": "number",
  "aiUsageRights": { "summary": "string" },
  "aiFeeEstimate": { "min": "number", "max": "number", "justification": "string" },
  "aiBriefs": [{ "deliverable": "string", "brief": "string" }],
  "summaryMarkdown": "string"
}
`;

/**
 * The main orchestrator for the AI deliverable planning pipeline.
 * @param dealDraftId - The ID of the DealDraft to generate a plan for.
 */
export async function generatePlanForDeal(dealDraftId: string) {
  // 1. Load Context
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: { include: { talents: { include: { pricingModels: true } } } }, email: true },
  });

  if (!dealDraft || !dealDraft.user || !dealDraft.email?.body) {
    throw new Error('Deal draft context is incomplete for plan generation.');
  }

  const talent = dealDraft.user.talents[0];

  // 2. Run AI Plan Generation
  const result = await aiClient.json(planGeneratorPrompt({
    rawText: dealDraft.email.body,
    creatorPricing: talent?.pricingModels || { default: 5000 },
  })) as any;

  // 3. Save the structured plan to the DealDraft
  const updatedDealDraft = await prisma.dealDraft.update({
    where: { id: dealDraftId },
    data: {
      aiDeliverablePlan: result.aiDeliverablePlan,
      aiTimeline: result.aiTimeline,
      aiRounds: result.aiRounds,
      aiUsageRights: result.aiUsageRights,
      aiFeeEstimate: result.aiFeeEstimate,
      aiBriefs: result.aiBriefs,
      notes: result.summaryMarkdown, // Use the notes field for the markdown summary
    },
  });

  // 4. (Optional) Create a NegotiationSession with the fee estimate
  await prisma.negotiationSession.upsert({
    where: { dealDraftId: dealDraftId }, // Requires a unique relation
    create: {
      userId: dealDraft.userId,
      dealDraftId: dealDraftId,
      brandName: dealDraft.brand || 'Unknown',
      aiBudgetPrediction: result.aiFeeEstimate.max,
    },
    update: {
      aiBudgetPrediction: result.aiFeeEstimate.max,
    },
  });

  console.log(`[AI PLANNER] Successfully generated deliverable plan for deal draft ${dealDraftId}.`);
  return updatedDealDraft;
}