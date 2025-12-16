import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateBrandReply } from '../../services/ai/aiBrandReplyEngine.js';
import { routeAIGeneratedReply } from '../../services/email/replyRouter.js';

/**
 * Worker to generate an AI reply for an inbound brand email.
 */
export default async function brandReplyProcessor(job: Job<{ emailId: string }>) {
  const { emailId } = job.data;
  console.log(`[WORKER] Generating brand reply for email: ${emailId}`);

  // 1. Load all necessary context
  const email = await prisma.inboundEmail.findUnique({ where: { id: emailId } });
  if (!email) throw new Error('Inbound email not found.');

  const dealThread = await prisma.dealThread.findFirst({ where: { dealDraft: { emailId } }, include: { strategy: true } });
  if (!dealThread) {
    console.warn(`No deal thread found for email ${emailId}, skipping reply.`);
    return;
  }

  const talent = await prisma.talent.findFirst({ where: { userId: email.userId }, include: { user: { include: { agentPolicy: true, personaProfile: true } } } });
  if (!talent) throw new Error('Talent not found.');

  // 2. Call the reply engine
  const reply = await generateBrandReply({
    inboundEmail: email,
    strategy: dealThread.strategy,
    persona: talent.user.personaProfile,
    policy: talent.user.agentPolicy,
  });

  // 3. Route the reply (send or save as suggestion)
  await routeAIGeneratedReply(reply, { email, dealThread, talent, policy: talent.user.agentPolicy });
}