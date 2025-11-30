import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const brandSimulationPrompt = (context: {
  ourStrategy: any;
  brandProfile: any;
  creatorProfile: any;
}) => `
You are a sophisticated AI negotiation simulator. Your task is to adopt the persona of a brand manager and simulate a full negotiation against our AI agent's proposed strategy.

**Our Agent's Strategy:**
${JSON.stringify(context.ourStrategy, null, 2)}

**Brand Persona to Adopt:**
${JSON.stringify(context.brandProfile, null, 2)}

**Creator Profile:**
${JSON.stringify(context.creatorProfile, null, 2)}

**Instructions:**
Simulate a 3-5 round email negotiation. For each round, generate the brand's reply. Then, provide a final summary of the entire simulated negotiation.
1.  **buildBrandPersona**: Based on the brand profile, decide if you will be a "Tough but Fair", "Budget-Constrained", or "Easy-Going" negotiator.
2.  **simulateNegotiation**: Play out the email exchange round by round. Generate the brand's likely counter-offers and objections.
3.  **Final Analysis**: After the simulation, provide a final analysis from an objective standpoint.

**JSON Output Schema:**
{
  "simulation": {
    "brandPersonaAdopted": "string",
    "rounds": [
      { "round": 1, "ourAgentSays": "string", "brandReply": "string", "brandCounterOffer": "number | null" }
    ],
    "finalOutcome": {
      "dealClosed": "boolean",
      "finalFee": "number",
      "reason": "string"
    }
  },
  "analysis": {
    "likelyMaxFee": "number",
    "closeProbability": "number (0-1)",
    "predictedObjections": ["string"],
    "predictedCounterMoves": ["string"]
  }
}
`;

/**
 * The main orchestrator for the brand counterparty simulation pipeline.
 * @param dealDraftId - The ID of the DealDraft to run the simulation for.
 */
export async function runBrandSimulation(dealDraftId: string) {
  // 1. Load Context (Deal, Our Strategy from S94, etc.)
  const session = await prisma.negotiationSession.findFirst({
    where: { dealDraftId },
    include: { user: true },
  });

  if (!session || !session.user) {
    throw new Error('A negotiation session with a unified plan must exist before running a simulation.');
  }

  // 2. Run the full simulation with AI
  const result = await aiClient.json(brandSimulationPrompt({
    ourStrategy: session.aiUnifiedPlan,
    brandProfile: { industry: 'Tech', negotiationStyle: 'data-driven' }, // Mocked
    creatorProfile: { tier: 'A', followers: 1000000 }, // Mocked
  })) as any;

  // 3. Save simulation output to the NegotiationSession
  const updatedSession = await prisma.negotiationSession.update({
    where: { id: session.id },
    data: {
      aiBrandSimulation: result.simulation,
      aiBrandObjections: result.analysis.predictedObjections,
      aiBrandCounterMoves: result.analysis.predictedCounterMoves,
      aiCloseProbability: Math.round(result.analysis.closeProbability * 100),
      aiLikelyMaxFee: result.analysis.likelyMaxFee,
    },
  });

  console.log(`[BRAND SIMULATOR] Completed simulation for deal ${dealDraftId}. Predicted Close Probability: ${updatedSession.aiCloseProbability}%`);
  return updatedSession;
}