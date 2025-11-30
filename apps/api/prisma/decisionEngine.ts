import type { NegotiationSimulation, AgentPolicy, DealThread } from '@prisma/client';

/**
 * Selects the best scenario from a list of simulations based on score and policy.
 * @param simulations - The array of simulated negotiation paths.
 * @param policy - The agent's operating policy.
 * @param deal - The current deal thread.
 * @returns The single best negotiation simulation path to take.
 */
export function selectBestScenario(
  simulations: NegotiationSimulation[],
  policy: AgentPolicy | null,
  deal: DealThread
): NegotiationSimulation {
  // Start with the highest-scoring simulation
  const sortedSims = [...simulations].sort((a, b) => (b.score || 0) - (a.score || 0));
  let bestScenario = sortedSims[0];

  // Apply policy overrides. For example, if policy is "PREMIUM_ONLY",
  // find the highest-scoring path that still meets that criteria.
  if (policy?.negotiationStyle === 'PREMIUM_ONLY') {
    const premiumPath = sortedSims.find(s => (s.predictedOutcome as any)?.finalBudget > (deal as any).strategy.targetRate);
    if (premiumPath) {
      bestScenario = premiumPath;
    }
  }

  // Add more validation logic here, e.g., check against negotiationCeilingPct

  return bestScenario;
}

/**
 * Generates the final reply text from a chosen scenario.
 */
export function generateReplyFromScenario(scenario: NegotiationSimulation): string {
  return (scenario.recommendedAction as any)?.script || 'Error: No script found.';
}

/**
 * Validates a reply before sending. A simple safety check.
 */
export function validateReply(reply: string): boolean {
  if (!reply || reply.length < 20 || reply.includes('stubbed')) {
    console.warn('[DECISION ENGINE] Reply failed validation:', reply);
    return false;
  }
  return true;
}