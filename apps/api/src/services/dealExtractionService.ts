import prisma from '../lib/prisma.js';
import { sendSlackAlert } from '../integrations/slack/slackClient.js';
import { runOfferExtractionForEmail } from './inboundEmail.service.js';

export async function extractDealFromEmail(emailId: string) {
  const email = await prisma.inboundEmail.findUnique({
    where: { id: emailId },
    include: { User: true }
  });
  if (!email) throw new Error("Email not found");

  const { extraction, drafts } = await runOfferExtractionForEmail(email);
  if (!drafts.length) {
    await sendSlackAlert("Deal extraction returned no offers", { emailId });
    return null;
  }

  const weakestConfidence = extraction.confidence ?? 1;
  if (weakestConfidence < 0.2) {
    await sendSlackAlert("Deal extraction low confidence", { emailId, drafts: drafts.map((d) => d.id) });
  }

  // queue negotiation insight generation
  try {
    const { negotiationQueue } = await import("../worker/queues.js");
    for (const draft of drafts) {
      await negotiationQueue.add("generate", { dealDraftId: draft.id });
    }
  } catch {
    /* ignore queue errors */
  }

  try {
    const { campaignQueue } = await import("../worker/queues.js");
    for (const draft of drafts) {
      await campaignQueue.add("build", { dealDraftId: draft.id }, { delay: 2000 });
    }
  } catch {
    /* ignore */
  }

  return drafts;
}
