import prisma from '../../lib/prisma.js';
import { loadAIContext } from './aiContextService.js';
import { sendTemplatedEmail } from '../email/emailClient.js';
import { updateBrandIntel } from './brandIntelService.js';
import { buildNegotiationDraft } from './negotiationComposer.js';
import { negotiationSessionQueue } from '../../worker/queues.js';

// Note: negotiationSession and negotiationMessage models don't exist in schema
// Use DealNegotiation model instead for production implementation
export async function performNegotiationTask({ userId, sessionId, step }: { userId: string; sessionId: string; step: string }) {
  console.warn("Negotiation task not yet implemented - models do not exist in schema");
  return;
  
  // Stub implementation (commented out original code below)
  /*
  const session = await prisma.negotiationSession.findUnique({
    where: { id: sessionId },
    include: { steps: true }
  });

  if (!session) throw new Error("Negotiation session not found");

  const ctx = await loadAIContext(userId);
  const { brandName, offerDetails } = session;

  const aiDraft = await buildNegotiationDraft({
    persona: ctx.persona,
    memory: ctx.memories,
    brandName,
    offer: offerDetails,
    step
  });

  const msg = await prisma.negotiationMessage.create({
    data: {
      sessionId,
      sender: "AI",
      subject: aiDraft.subject,
      body: aiDraft.body,
      sequence: session.steps.length + 1,
      metadata: { step }
    }
  });

  const shouldSend = process.env.AI_NEGOTIATION_AUTO_SEND === "true" && session.status === "active";

  if (shouldSend && session.brandEmail) {
    await sendTemplatedEmail({
      to: session.brandEmail,
      subject: aiDraft.subject,
      template: "plain",
      variables: { text: aiDraft.body }
    });

    await prisma.negotiationMessage.update({
      where: { id: msg.id },
      data: { status: "sent" }
    });
  }

  await updateBrandIntel(brandName, {
    history: {
      lastNegotiation: new Date().toISOString()
    }
  });

  if (step === "initial") {
    await queueFollowUp(sessionId, userId);
  }
  */
}

export async function queueFollowUp(sessionId: string, userId: string) {
  const delay = 1000 * 60 * 60 * 48; // 48h
  await negotiationSessionQueue.add(
    "nego-followup",
    { userId, sessionId, step: "followup" },
    { delay }
  );
}
