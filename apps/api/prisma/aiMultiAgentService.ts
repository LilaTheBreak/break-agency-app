import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const agentPrompt = (persona: string, context: any) => `
You are an AI agent on a panel reviewing a potential creator deal. Your persona is **${persona}**.

**Deal Context:**
${JSON.stringify(context, null, 2)}

**Your Task:**
Provide your expert opinion based *only* on your persona.
- **Economist**: Focus on market rates, value, and ROI.
- **Legal**: Focus on contract risks, usage rights, and liability.
- **Talent Agent**: Focus on brand fit, creator happiness, and long-term relationship.
- **Strategist**: Focus on negotiation tactics and game theory.

**JSON Output Schema:**
{
  "perspective": "${persona}",
  "recommendedFee": "number",
  "justification": "string",
  "concerns": ["string"],
  "opportunities": ["string"],
  "confidence": "number (0-1)"
}
`;

const debatePrompt = (opinions: any[]) => `
You are the **Head Strategist** moderating a debate between AI agents. Their initial opinions are below. Your task is to synthesize these viewpoints into a single, unified strategy.

**Panel Opinions:**
---
${JSON.stringify(opinions, null, 2)}
---

**Instructions:**
1.  Acknowledge the key points from each agent.
2.  Identify the primary point of contention or agreement.
3.  Formulate a unified plan that balances the different perspectives.
4.  Define a concrete opening counter-offer and a "walk-away" price.

**JSON Output Schema:**
{
  "unifiedPlan": {
    "summary": "string",
    "openingCounter": "number",
    "walkAwayPrice": "number",
    "keyTalkingPoints": ["string"]
  },
  "alternatives": [
    { "name": "string (e.g., 'Aggressive Push')", "description": "string" }
  ],
  "finalConfidence": "number (0-1)"
}
`;

/**
 * Runs a single agent's analysis.
 */
async function runAgent(persona: string, context: any) {
  const prompt = agentPrompt(persona, context);
  return aiClient.json(prompt);
}

/**
 * The main orchestrator for the multi-agent negotiation pipeline.
 * @param dealDraftId - The ID of the DealDraft to analyze.
 */
export async function runMultiAgentNegotiation(dealDraftId: string) {
  // 1. Load Context
  const dealDraft = await prisma.dealDraft.findUnique({
    where: { id: dealDraftId },
    include: { user: true, email: true },
  });

  if (!dealDraft || !dealDraft.user || !dealDraft.email) {
    throw new Error('Deal draft context is incomplete for multi-agent analysis.');
  }

  const context = {
    brandName: dealDraft.brand,
    offer: dealDraft.offerValue,
    deliverables: dealDraft.deliverables,
    emailBody: dealDraft.email.body,
  };

  // 2. Round 1: Independent Opinions
  console.log(`[MULTI-AGENT] Round 1: Gathering independent opinions for deal ${dealDraftId}.`);
  const agents = ['Economist', 'Legal', 'Talent Agent', 'Strategist'];
  const opinions = await Promise.all(agents.map(persona => runAgent(persona, context)));

  // 3. Final Round: Unify Strategy
  console.log('[MULTI-AGENT] Final Round: Synthesizing a unified strategy.');
  const finalResult = await aiClient.json(debatePrompt(opinions)) as any;

  // 4. Save results to NegotiationSession
  const session = await prisma.negotiationSession.upsert({
    where: { dealDraftId: dealDraftId }, // Assuming a unique relation
    create: {
      userId: dealDraft.userId,
      dealDraftId: dealDraftId,
      brandName: dealDraft.brand || 'Unknown',
      brandEmail: dealDraft.email.from,
      aiAgentDebate: opinions,
      aiUnifiedPlan: finalResult.unifiedPlan,
      aiAlternatives: finalResult.alternatives,
      aiAgentConfidence: Math.round(finalResult.finalConfidence * 100),
      status: 'analyzed',
    },
    update: {
      aiAgentDebate: opinions,
      aiUnifiedPlan: finalResult.unifiedPlan,
      aiAlternatives: finalResult.alternatives,
      aiAgentConfidence: Math.round(finalResult.finalConfidence * 100),
    },
  });

  // 5. Integrate with S93: Create the first negotiation message based on the unified plan
  await prisma.negotiationMessage.create({
    data: {
      sessionId: session.id,
      // threadId would be created/linked here
      sender: 'ai_draft',
      subject: `Regarding the proposal for ${dealDraft.brand}`,
      body: `Hi team,\n\nThanks for reaching out. After reviewing the proposal, we'd like to suggest a rate of £${finalResult.unifiedPlan.openingCounter} to better align with the scope of work.\n\nBest,`,
      aiGenerated: true,
    },
  });

  console.log(`[MULTI-AGENT] Completed analysis for deal ${dealDraftId}. Session ID: ${session.id}`);
  return session;
}