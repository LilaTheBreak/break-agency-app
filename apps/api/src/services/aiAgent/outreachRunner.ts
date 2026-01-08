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

  // Extract brandName and brandEmail from targets JSON
  const targets = (plan.targets as any) || {};
  const brandName = targets.brandName || plan.name;
  const brandEmail = targets.brandEmail;

  const draft = await generateOutreachMessage(userId, brandName);

  const mockContent = {
    subject: `Collaboration opportunity with ${brandName}?`,
    message: `Hi! We'd love to explore a collab. (AI mock draft)`
  };

  // Create outreach record
  await prisma.outreach.create({
    data: {
      id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      target: brandName,
      type: "Brand",
      contact: "Brand Representative",
      contactEmail: brandEmail || undefined,
      status: dryRun ? "draft" : "sent",
      summary: mockContent.message,
      createdBy: userId,
      updatedAt: new Date()
    }
  });

  if (!dryRun && brandEmail) {
    await sendTemplatedEmail({
      to: brandEmail,
      subject: mockContent.subject,
      template: "contact",
      data: { text: mockContent.message }
    });
  }

  await updateBrandIntel(brandName, {
    history: {
      lastOutreach: new Date().toISOString()
    }
  });

  await logInteraction({
    userId,
    entity: "outreach",
    entityId: plan.id,
    summary: `Outreach to ${brandName}`,
    metadata: mockContent
  });

  await prisma.outreachPlan.update({
    where: { id: plan.id },
    data: { status: "sent" }
  });
}
