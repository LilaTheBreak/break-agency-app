import type { Job } from "bullmq";
import prisma from '../../lib/prisma.js';
import { classifyEmail } from '../../services/inbox/classifyEmail.js';
import { createDealDraft } from '../../services/inbox/createDealDraft.js';
import { calculatePriorityScore } from '../../services/inbox/priorityScore.js';
import { sendSlackAlert } from '../../integrations/slack/slackClient.js';

type InboxJobData = {
  emailId: string;
};

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function inboxProcessor(job: Job<InboxJobData>) {
  const { emailId } = job.data;
  console.log(`[WORKER] Processing inbox job for email: ${emailId}`);

  const email = await prisma.inboundEmail.findUnique({ where: { id: emailId } });
  if (!email) {
    throw new Error(`Email with ID ${emailId} not found.`);
  }

  // 1. Run AI classification
  const classification = await classifyEmail(email.subject, email.body || "");

  // 2. Calculate priority score
  const { score } = calculatePriorityScore(classification);

  // 3. Update email record with AI insights
  const updatedEmail = await prisma.inboundEmail.update({
    where: { id: emailId },
    data: {
      aiJson: classification as any,
      aiCategory: classification.category,
      aiBrand: classification.brand,
      aiUrgency: classification.urgency,
      aiConfidence: classification.confidence,
      aiRecommendedAction: classification.suggestedAction,
      aiDeadline: classification.deadline,
      priorityScore: score
    }
  });

  console.log(`[WORKER] Classified email ${emailId} as ${classification.category} with score ${score}`);

  // 4. Create a DealDraft if applicable
  let dealDraftId: string | undefined;
  if (classification.category === "deal" && classification.brand) {
    const dealDraft = await createDealDraft(emailId, email.userId, classification);
    if (dealDraft) {
      dealDraftId = dealDraft.id;
      await prisma.inboundEmail.update({
        where: { id: emailId },
        data: { dealDraftId: dealDraft.id }
      });
    }
  }

  // 5. Send Slack notification
  if (classification.category === "deal" && classification.brand) {
    const budget = classification.extracted.budget ? `Budget: ${classification.extracted.currency} ${classification.extracted.budget}` : "";
    await sendSlackAlert(`[NEW DEAL] ${classification.brand}. ${budget}`);
  } else if (classification.category === "invite") {
    await sendSlackAlert(`[INVITE] Event at ${classification.extracted.location} on ${classification.extracted.eventDate}`);
  }

  console.log(`[WORKER] Finished inbox job for email: ${emailId}`);
  return { status: "completed", classification, score, dealDraftId };
}