import prisma from '../../lib/prisma.js';
import { aiClient } from '../../services/ai/aiClient.js';
import { applyPersona } from '../../services/ai/persona/personaApplier.js';
import { buildContractForDeal } from '../../services/contract/contractBuilder.js';

const autoPilotPrompt = (context: {
  history: string;
  policy: any;
  pricing: any;
  roundNumber: number;
}) => `
You are an autonomous AI negotiation agent. Your goal is to get the best possible rate for our creator while adhering to strict policies.

**Agent Policy:**
- Negotiation Style: ${context.policy.negotiationStyle}
- Auto-Send Replies: ${!context.policy.sandboxMode && context.policy.autoSendNegotiation}
- Rate Ceiling (Max increase from initial offer): ${context.policy.negotiationCeilingPct}%

**Creator Pricing:**
- Minimum Rate: £${context.pricing.min}
- Target Rate: £${context.pricing.target}

**Negotiation History (Round ${context.roundNumber}):**
---
${context.history}
---

**Instructions:**
Analyze the full conversation and decide the next move.
1.  **evaluateBrandSentiment**: Is the brand's tone positive, neutral, or negative?
2.  **shouldEscalate**: Based on the complexity, sentiment, or if the deal is stalled, should you escalate to a human agent?
3.  **decideNextMove**: If not escalating, what is the next strategic move? ('COUNTER', 'ACCEPT', 'CLARIFY', 'FOLLOW_UP').
4.  **generateNextEmail**: Draft the subject and body for the next email based on your decision.

**JSON Output Schema:**
{
  "sentiment": "'positive' | 'neutral' | 'negative'",
  "escalateToHuman": "boolean",
  "escalationReason": "string | null",
  "nextMove": {
    "decision": "'COUNTER' | 'ACCEPT' | 'CLARIFY' | 'FOLLOW_UP'",
    "justification": "string",
    "counterOfferValue": "number | null"
  },
  "draft": { "subject": "string", "body": "string" }
}
`;

/**
 * The main orchestrator for a single run of the negotiation auto-pilot.
 * @param threadId - The ID of the NegotiationThread to process.
 */
export async function runAutoPilotForThread(threadId: string) {
  // 1. Load Negotiation State
  const thread = await prisma.negotiationThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { include: { agentPolicy: true, personaProfile: true, talents: { include: { pricingModels: true } } } },
    },
  });
  if (!thread || !thread.user) throw new Error('Negotiation context not found.');

  const history = thread.messages.map(m => `${m.sender}: ${m.body}`).join('\n\n');
  const roundNumber = Math.ceil(thread.messages.length / 2);

  // 2. Decide Next Move with AI
  const decision = await aiClient.json(autoPilotPrompt({
    history,
    policy: thread.user.agentPolicy,
    pricing: { min: 5000, target: 7500 }, // Mocked from pricing models
    roundNumber,
  })) as any;

  // 3. Handle Escalation
  if (decision.escalateToHuman) {
    console.log(`[AUTO-PILOT] Escalating thread ${threadId} to human. Reason: ${decision.escalationReason}`);
    await prisma.negotiationThread.update({ where: { id: threadId }, data: { status: 'needs_review', lastAiAction: decision } });
    // Trigger Slack alert to manager
    return;
  }

  // Handle "ACCEPT" decision
  if (decision.nextMove.decision === 'ACCEPT') {
    console.log(`[AUTO-PILOT] Agreement reached for thread ${threadId}. Triggering contract generation.`);
    await prisma.negotiationThread.update({ where: { id: threadId }, data: { status: 'won', finalOutcome: 'agreement_reached', finalRate: decision.nextMove.counterOfferValue } });
    await buildContractForDeal(threadId); // Trigger S87 pipeline
    return;
  }

  // 4. Generate and Send Message (or Draft)
  const finalBody = thread.user.personaProfile
    ? await applyPersona(decision.draft.body, thread.user.personaProfile)
    : decision.draft.body;

  const messageData = {
    threadId,
    sessionId: thread.messages[0]?.sessionId, // Carry over session
    sender: 'ai_draft',
    subject: decision.draft.subject,
    body: finalBody,
    responsePlan: decision.nextMove,
  };

  // Check auto-send policy
  const shouldAutoSend = !thread.user.agentPolicy?.sandboxMode && thread.user.agentPolicy?.autoSendNegotiation;
  if (shouldAutoSend) {
    console.log(`[AUTO-PILOT] Auto-sending reply for thread ${threadId}.`);
    // await gmailService.sendEmail({ to: thread.brandEmail, ... });
    messageData.sender = 'ai_sent';
  }

  await prisma.negotiationMessage.create({ data: messageData });

  // 5. Update Memory and State
  await prisma.negotiationThread.update({
    where: { id: threadId },
    data: { lastAiAction: decision, lastAIAgentMessageAt: new Date() },
  });

  console.log(`[AUTO-PILOT] Successfully processed round ${roundNumber} for thread ${threadId}. Decision: ${decision.nextMove.decision}`);
}