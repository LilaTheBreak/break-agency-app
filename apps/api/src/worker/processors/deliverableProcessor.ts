import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";

export default async function deliverableProcessor(job: any) {
  const { deliverableId } = job.data ?? {};
  if (!deliverableId) return;

  const deliverable = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
  if (!deliverable) return;

  await sendSlackAlert("Deliverable overdue", {
    deliverableId,
    userId: deliverable.userId,
    title: deliverable.title,
    dueDate: deliverable.dueDate
  });

  return true;
}
