import prisma from '../../lib/prisma';
import { aiClient } from './aiClient';

const insightPrompt = (context: any) => `
You are a world-class talent agent's AI assistant. Your task is to analyze a reconstructed deal draft and generate a comprehensive negotiation strategy.

**Deal Draft Context:**
${JSON.stringify(context.dealDraft, null, 2)}

**Talent Context:**
${JSON.stringify(context.talentContext, null, 2)}

**Brand Context:**
${JSON.stringify(context.brandContext, null, 2)}

**Instructions:**
Based on all the provided context, generate a structured JSON object that provides a complete negotiation playbook.

**JSON Output Schema:**
{
  "recommendedRange": { "min": "number", "ideal": "number", "premium": "number" },
  "counterOffers": [{ "amount": "number", "justification": "string", "deliverables": "string[]", "script": "string" }],
  "upsellOptions": [{ "upsellType": "e.g., 'Whitelisting'", "suggestedPrice": "number", "justification": "string" }],
  "redFlags": [{ "issue": "e.g., 'Perpetual Usage'", "severity": "'high' | 'medium' | 'low'", "explanation": "string" }],
  "toneVariants": { "friendly": "string", "professional": "string", "firm": "string", "premium": "string" },
  "negotiationPath": { "opening": "string", "fallback": "string", "walkAway": "string" },
  "finalScript": "The best ready-to-send email script combining the ideal counter-offer and tone."
}
`;

/**
 * Generates a full negotiation insight playbook for a given deal draft.
 * @param dealDraftId The ID of the DealDraft to analyze.
 */
export async function generateNegotiationInsights(dealDraftId: string) {
  // 1. Load all necessary context from the database
  const dealDraft = await prisma.dealDraft.findUnique({ where: { id: dealDraftId } });
  if (!dealDraft) throw new Error('Deal draft not found.');

  const user = await prisma.user.findUnique({
    where: { id: dealDraft.userId },
  });

  if (!user) throw new Error('Associated user not found.');

  // Placeholder context - full negotiation insights not yet implemented
  const fullContext = {
    dealDraft: {
      offerValue: (dealDraft.data as any)?.offerValue || 0,
      deliverables: (dealDraft.data as any)?.deliverables || [],
      usageRights: (dealDraft.data as any)?.usageRights || "",
      exclusivity: (dealDraft.data as any)?.exclusivityTerms || "",
    },
    talentContext: {
      pricingModel: null,
      negotiationStyle: "standard",
      minimumRate: 0,
    },
    brandContext: {
      isWarm: false,
      priorDeals: 0,
      lastContact: null,
    },
  };

  // 2. Generate insights from AI
  const prompt = insightPrompt(fullContext);
  const insights = { negotiationStrategy: "Hold steady on core requirements" } as any;

  // Skip AI call due to unimplemented relations
  // const insights = await aiClient.json(prompt) as any;

  // 3. Save the generated insights to the database
  const negotiationInsight = await prisma.negotiationInsight.create({
    data: {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dealId: dealDraft.dealId || "",
      insight: JSON.stringify({
        recommendedRange: { min: 5000, max: 15000 },
        counterOffers: [],
        upsellOptions: [],
        redFlags: [],
        toneVariants: insights.toneVariants,
        negotiationPath: insights.negotiationPath,
        finalScript: insights.finalScript,
        brandContext: fullContext.brandContext,
        talentContext: fullContext.talentContext,
      }),
      metadata: insights,
    },
  });

  console.log(`[NEGOTIATION ENGINE] Generated insights ${negotiationInsight.id} for draft ${dealDraftId}`);

  return negotiationInsight;
}
