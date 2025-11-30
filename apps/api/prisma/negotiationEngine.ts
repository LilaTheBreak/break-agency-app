import prisma from '../../lib/prisma.js';
import { aiClient } from '../../services/ai/aiClient.js';
import { applyPersona } from '../../services/ai/persona/personaApplier.js';

const negotiationPrompt = (context: {
  emailBody: string;
  history: string;
  pricingModel: any;
  brandRelationship: any;
}) => `
You are a world-class AI negotiation agent for a talent agency. Your goal is to analyze an inbound offer, formulate a multi-step strategy, and draft the first response.

**Creator's Pricing Model:**
${JSON.stringify(context.pricingModel, null, 2)}

**Brand Relationship:**
${JSON.stringify(context.brandRelationship, null, 2)}

**Negotiation History (if any):**
${context.history || 'None'}

**Latest Inbound Email:**
---
${context.emailBody}
---

**Instructions:**
Perform a deep analysis and generate a complete negotiation plan.
1.  **Analyze Offer**: Extract the core offer details (value, deliverables, usage, exclusivity).
2.  **Predict Rate Range**: Based on the creator's pricing model, calculate the minimum, target, and premium rates for this offer.
3.  **Detect Red Flags**: Identify any high-risk terms (e.g., perpetual usage, unclear payment terms).
4.  **Generate Strategy**: Create a multi-step negotiation plan. Define an opening move, a fallback position, and potential upsells.
5.  **Generate Email Draft**: Write the subject and body for the first email based on your strategy. The tone should be professional but firm.

**JSON Output Schema:**
{
  "analysis": {
    "offerDetected": { "value": "number", "deliverables": "string" },
    "ratePrediction": { "min": "number", "target": "number", "premium": "number", "budgetLikelihood": "number (0-1)" },
    "redFlags": [{ "risk": "string", "suggestion": "string" }]
  },
  "strategy": {
    "openingMove": { "type": "'COUNTER' | 'CLARIFY'", "details": "string" },
    "fallbackPosition": { "type": "'DISCOUNT' | 'ADD_VALUE'", "details": "string" },
    "upsells": ["string"]
  },
  "draft": {
    "subject": "string",
    "body": "string",
    "tone": "string",
    "reasoning": "string"
  }
}
`;

/**
 * The main orchestrator for the deep negotiation analysis pipeline.
 * @param emailId - The ID of the InboundEmail to analyze.
 */
export async function analyzeAndStrategize(emailId: string) {
  // 1. Load Context
  const email = await prisma.inboundEmail.findUnique({
    where: { id: emailId },
    include: { user: { include: { talents: { include: { pricingModels: true } }, agentPolicy: true, personaProfile: true } } },
  });
  if (!email || !email.user) throw new Error('Email or user context not found.');

  const talent = email.user.talents[0];
  if (!talent) throw new Error('Talent profile not found.');

  // Find or create the negotiation thread for idempotency
  let thread = await prisma.negotiationThread.findFirst({ where: { messages: { some: { emailId } } } });
  if (!thread) {
    thread = await prisma.negotiationThread.create({ data: { userId: email.userId, brandEmail: email.from!, brandName: email.aiBrand } });
  }

  // 2. Run AI Analysis & Strategy Generation
  const result = await aiClient.json(negotiationPrompt({
    emailBody: email.body || '',
    history: '', // In a real multi-round system, you'd fetch this from the thread
    pricingModel: talent.pricingModels,
    brandRelationship: { warmth: 'cold', pastDeals: 0 }, // This would come from the BrandRelationship model
  })) as any;

  // 3. Apply Persona to the draft
  const finalBody = email.user.personaProfile ? await applyPersona(result.draft.body, email.user.personaProfile) : result.draft.body;

  // 4. Save all artifacts to the database
  const session = await prisma.negotiationSession.create({
    data: {
      userId: email.userId,
      brandName: email.aiBrand || 'Unknown',
      brandEmail: email.from,
      offerDetails: result.analysis.offerDetected,
      strategy: result.strategy,
      status: 'analyzed',
    },
  });

  await prisma.negotiationMessage.create({
    data: {
      sessionId: session.id,
      threadId: thread.id,
      sender: 'ai_draft',
      subject: result.draft.subject,
      body: finalBody,
      aiScoring: result.analysis,
      responsePlan: result.strategy,
    },
  });

  await prisma.aIAgentExecutionLog.create({
    data: { userId: email.userId, action: 'negotiation_analysis_v2', input: { emailId }, output: result.analysis },
  });

  return { analysis: result.analysis, strategy: result.strategy, draft: { ...result.draft, body: finalBody } };
}