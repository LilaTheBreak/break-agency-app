import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const fullNegotiationPrompt = (context: {
  emailBody: string;
  creatorPricing: any;
  brandInfo: any;
}) => `
You are a world-class AI negotiation agent for a talent agency. Your goal is to analyze an inbound offer, formulate a complete strategy, and draft the first response.

**Creator's Pricing:**
${JSON.stringify(context.creatorPricing, null, 2)}

**Brand Info:**
${JSON.stringify(context.brandInfo, null, 2)}

**Latest Inbound Email:**
---
${context.emailBody}
---

**Instructions:**
Perform a deep analysis and generate a complete negotiation plan in a structured JSON format.
1.  **analyseOffer**: Extract the core offer details (value, deliverables, usage, exclusivity).
2.  **predictBrandBudget**: Based on the brand's profile and the offer, predict their likely maximum budget.
3.  **predictDealCloseProbability**: Estimate the probability (0-1) of closing this deal.
4.  **createNegotiationPlan**: Create a multi-step negotiation plan with an opening move and fallback positions.
5.  **generateCounterOffer**: Structure a specific counter-offer.
6.  **generateNegotiationEmail**: Draft a subject and body for the first email based on your strategy.

**JSON Output Schema:**
{
  "aiRiskScore": "number (0-100, higher is riskier)",
  "aiBudgetPrediction": "number",
  "dealCloseProbability": "number (0-1)",
  "aiStrategy": {
    "planName": "string (e.g., 'Anchor High & Concede')",
    "steps": ["string"]
  },
  "aiCounterOffer": {
    "value": "number",
    "justification": "string"
  },
  "aiTalkingPoints": ["string"],
  "draft": {
    "subject": "string",
    "body": "string"
  }
}
`;

/**
 * The main orchestrator for the deep negotiation analysis and strategy pipeline.
 * @param dealDraftId - The ID of the DealDraft to analyze.
 */
export async function runFullNegotiationAI(dealDraftId: string) {
  // 1. Load all necessary context
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: { include: { talents: { include: { pricingModels: true } } } }, email: true },
  });

  if (!dealDraft || !dealDraft.user || !dealDraft.email) {
    throw new Error('Deal draft context is incomplete for negotiation analysis.');
  }

  const talent = dealDraft.user.talents[0];

  // 2. Run the comprehensive AI analysis
  const result = await aiClient.json(fullNegotiationPrompt({
    emailBody: dealDraft.email.body || '',
    creatorPricing: talent?.pricingModels || { default: 5000 },
    brandInfo: { name: dealDraft.brand, industry: 'Unknown' },
  })) as any;

  // 3. Create the NegotiationSession to store the AI's strategic thinking
  const session = await prisma.negotiationSession.create({
    data: {
      userId: dealDraft.userId,
      brandName: dealDraft.brand || 'Unknown',
      brandEmail: dealDraft.email.from,
      offerDetails: { initialOffer: (dealDraft.offerValue || 0) },
      aiStrategy: result.aiStrategy,
      aiCounterOffer: result.aiCounterOffer,
      aiTalkingPoints: result.aiTalkingPoints,
      aiBudgetPrediction: result.aiBudgetPrediction,
      aiRiskScore: result.aiRiskScore,
    },
  });

  // 4. Create the first AI-generated message in the thread
  const thread = await prisma.negotiationThread.create({
    data: {
      userId: dealDraft.userId,
      brandEmail: dealDraft.email.from!,
      brandName: dealDraft.brand,
      dealId: dealDraftId,
    },
  });

  await prisma.negotiationMessage.create({
    data: {
      sessionId: session.id,
      threadId: thread.id,
      sender: 'ai_draft',
      subject: result.draft.subject,
      body: result.draft.body,
      aiGenerated: true,
    },
  });

  // 5. Notify team via Slack (stub)
  console.log(`[SLACK NOTIFICATION] AI negotiation strategy generated for ${dealDraft.brand}. Risk score: ${result.aiRiskScore}`);

  return session;
}