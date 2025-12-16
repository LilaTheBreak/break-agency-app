import prisma from '../../lib/prisma.js';
import { runNegotiationSimulation } from '../../pipelines/simulationPipeline.js';
import { selectBestScenario, generateReplyFromScenario, validateReply } from './decisionEngine.js';

// Placeholder for a real Gmail service
const gmailService = {
  sendEmail: async (payload: any) => console.log('[GMAIL STUB] Sending email:', payload.subject),
  createDraft: async (payload: any) => console.log('[GMAIL STUB] Creating draft:', payload.subject),
};

/**
 * Runs the full autonomous negotiation logic for a single deal.
 * @param dealId - The ID of the DealThread to process.
 */
export async function runAutoNegotiation(dealId: string) {
  // 1. Load all necessary context
  const deal = await prisma.dealThread.findUnique({
    where: { id: dealId },
    include: { user: { include: { agentPolicy: true } }, simulations: true },
  });

  if (!deal || !deal.user) throw new Error('Deal or user not found.');

  let simulations = deal.simulations;
  // 2. Ensure simulations exist, or run them now
  if (!simulations || simulations.length === 0) {
    const result = await runNegotiationSimulation(dealId);
    simulations = result.simulations;
  }

  // 3. Pick the best scenario via the decision engine
  const bestScenario = selectBestScenario(simulations, deal.user.agentPolicy, deal);

  // 4. Generate and validate the reply
  const reply = generateReplyFromScenario(bestScenario);
  if (!validateReply(reply)) {
    throw new Error('Generated reply failed validation.');
  }

  // 5. Check policy and either send or draft the email
  const policy = deal.user.agentPolicy;
  const emailPayload = { to: deal.brandEmail, subject: `Re: ${deal.subjectRoot}`, body: reply };

  if (policy?.sandboxMode) {
    await gmailService.createDraft(emailPayload);
  } else if (policy?.autoSendNegotiation) {
    await gmailService.sendEmail(emailPayload);
  } else {
    await gmailService.createDraft(emailPayload);
  }

  // 6. Log the actions
  await prisma.negotiationMessage.create({
    data: {
      threadId: dealId,
      sender: 'ai',
      body: reply,
      aiGenerated: true,
      status: policy?.autoSendNegotiation && !policy.sandboxMode ? 'sent' : 'draft',
    },
  });

  await prisma.dealThread.update({
    where: { id: dealId },
    data: {
      lastAiAction: {
        action: 'auto_reply',
        path: bestScenario.pathName,
        sent: policy?.autoSendNegotiation && !policy.sandboxMode,
        timestamp: new Date(),
      },
    },
  });

  await prisma.aIAgentExecutionLog.create({
    data: {
      talentId: 'placeholder_talent_id', // This should be linked properly
      action: 'auto_negotiation_reply',
      input: { dealId, path: bestScenario.pathName },
      output: { reply },
    },
  });

  console.log(`[AUTO-AGENT] Processed deal ${dealId}. Chosen path: ${bestScenario.pathName}.`);
}