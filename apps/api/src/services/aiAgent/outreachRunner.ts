import prisma from "../../lib/prisma.js";
import { generateOutreachMessage } from "./outreachComposer.js";
import { logInteraction } from "./aiContextService.js";
import { sendTemplatedEmail } from "../email/emailClient.js";
import { updateBrandIntel } from "./brandIntelService.js";

export async function performOutreachTask(task: { userId: string; outreachPlanId: string; dryRun?: boolean }) {
  const { userId, outreachPlanId, dryRun } = task;

  const plan = await prisma.outreachPlan.findUnique({
    where: { id: outreachPlanId }
  });
  if (!plan) throw new Error("Outreach plan not found");

  const draft = await generateOutreachMessage(userId, plan.brandName);

  const mockContent = {
    subject: `Collaboration opportunity with ${plan.brandName}?`,
    message: `Hi! We'd love to explore a collab. (AI mock draft)`
  };

  await prisma.outreachLog.create({
    data: {
      userId,
      brandName: plan.brandName,
      brandEmail: plan.brandEmail,
      subject: mockContent.subject,
      message: mockContent.message,
      status: dryRun ? "draft" : "sent"
    }
  });

  if (!dryRun && plan.brandEmail) {
    await sendTemplatedEmail({
      to: plan.brandEmail,
      subject: mockContent.subject,
      template: "plain",
      variables: { text: mockContent.message }
    });
  }

  await updateBrandIntel(plan.brandName, {
    history: {
      lastOutreach: new Date().toISOString()
    }
  });

  await logInteraction({
    userId,
    entity: "outreach",
    entityId: plan.id,
    summary: `Outreach to ${plan.brandName}`,
    metadata: mockContent
  });

  await prisma.outreachPlan.update({
    where: { id: plan.id },
    data: { status: "sent" }
  });
}
