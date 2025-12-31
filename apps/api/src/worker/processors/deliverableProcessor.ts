import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function deliverableProcessor(job: any) {
  const { deliverableId } = job.data ?? {};
  if (!deliverableId) {
    throw new Error(`deliverableProcessor: missing deliverableId in job data. Job data: ${JSON.stringify(job.data)}`);
  }

  const deliverable = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
  if (!deliverable) {
    throw new Error(`deliverableProcessor: deliverable ${deliverableId} not found`);
  }

  await sendSlackAlert("Deliverable overdue", {
    deliverableId,
    dealId: deliverable.dealId,
    title: deliverable.title,
    dueAt: deliverable.dueAt
  });

  return true;
}
