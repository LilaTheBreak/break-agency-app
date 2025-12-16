import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const rateCurvePrompt = (context: any) => `
You are a predictive financial modeler for a talent agency, specializing in negotiation outcomes.

**Deal Context:**
- **Brand:** ${context.brandName}
- **Creator Tier:** ${context.creatorTier}
- **Initial Offer:** £${context.initialOffer}
- **Our Opening Counter:** £${context.ourOpeningCounter}
- **Negotiation History:** ${context.history || 'None'}

**Instructions:**
Based on the context, predict the brand's willingness to accept various counter-offers. Generate a probability curve for the following fee points. The output must be a JSON array of objects.

**JSON Output Schema:**
[
  { "fee": "number", "probability": "number (0.0-1.0)" }
]
`;

/**
 * Analyzes a probability curve to find the optimal counter-offer.
 * This is a simple strategy: find the highest fee with a probability >= 60%.
 */
function getOptimalCounter(curve: { fee: number; probability: number }[]): number {
  const optimal = curve
    .filter(point => point.probability >= 0.6)
    .sort((a, b) => b.fee - a.fee)[0];
  return optimal ? optimal.fee : curve[0]?.fee || 0;
}

/**
 * Analyzes a probability curve to estimate the brand's maximum budget.
 * This is a simple strategy: find the point just before the biggest probability drop.
 */
function computeMaxBudget(curve: { fee: number; probability: number }[]): number {
  let maxDrop = 0;
  let maxBudget = curve[curve.length - 1]?.fee || 0;

  for (let i = 1; i < curve.length; i++) {
    const drop = curve[i - 1].probability - curve[i].probability;
    if (drop > maxDrop) {
      maxDrop = drop;
      maxBudget = curve[i - 1].fee;
    }
  }
  return maxBudget;
}

/**
 * The main orchestrator for the rate prediction pipeline.
 * @param sessionId - The ID of the NegotiationSession to analyze.
 */
export async function predictRateCurve(sessionId: string) {
  // 1. Build Negotiation Vector
  const session = await prisma.negotiationSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } }, user: true },
  });

  if (!session || !session.user) {
    throw new Error('Negotiation session or user context not found.');
  }

  const context = {
    brandName: session.brandName,
    creatorTier: 'A', // Mocked
    initialOffer: (session.offerDetails as any)?.initialOffer || 0,
    ourOpeningCounter: (session.aiCounterOffer as any)?.value || 0,
    history: session.messages.map(m => `${m.sender}: ${m.body}`).join('\n\n'),
  };

  // 2. Run Scenario Curve with AI
  const rateCurve = await aiClient.json(rateCurvePrompt(context)) as { fee: number; probability: number }[];

  if (!rateCurve || rateCurve.length === 0) {
    throw new Error('AI failed to generate a valid rate curve.');
  }

  // 3. Compute metrics from the curve
  const predictedMaxBudget = computeMaxBudget(rateCurve);
  const recommendedCounter = getOptimalCounter(rateCurve);

  // 4. Save results to the database
  const updatedSession = await prisma.negotiationSession.update({
    where: { id: sessionId },
    data: {
      aiRateCurve: rateCurve,
      aiPredictedMaxBudget: predictedMaxBudget,
      aiRecommendedCounter: recommendedCounter,
      aiRateConfidence: rateCurve.find(p => p.fee === recommendedCounter)?.probability || 0,
    },
  });

  console.log(`[RATE PREDICTOR] Analysis complete for session ${sessionId}. Recommended Counter: £${recommendedCounter}`);
  return updatedSession;
}