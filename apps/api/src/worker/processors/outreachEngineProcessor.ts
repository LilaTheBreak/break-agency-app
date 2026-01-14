import prisma from '../../lib/prisma.js';
import { generateFollowUpMessage } from '../../services/ai/outreachAIService.js';

async function sendEmailViaGmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  // Stub: replace with real Gmail send
  return { to, subject, text };
}

// Phase 3: Fail loudly - throw errors so BullMQ can retry
export default async function outreachEngineProcessor(job: any) {
  const actionId = job.data?.actionId;
  if (!actionId) {
    throw new Error(`outreachEngineProcessor: missing actionId in job data. Job data: ${JSON.stringify(job.data)}`);
  }

  const action = await prisma.outreachAction.findUnique({ where: { id: actionId } });
  if (!action) {
    throw new Error(`outreachEngineProcessor: action ${actionId} not found`);
  }
  if (action.status !== "pending") {
    throw new Error(`outreachEngineProcessor: action ${actionId} is not pending (status: ${action.status})`);
  }

  await prisma.outreachAction.update({
    where: { id: actionId },
    data: { status: "processing" }
  });

  try {
    if (action.actionType === "send_email") {
      await handleSendEmail(action);
    } else if (action.actionType === "follow_up") {
      await handleFollowUp(action);
    }

    await prisma.outreachAction.update({
      where: { id: actionId },
      data: { status: "completed" }
    });
  } catch (err) {
    await prisma.outreachAction.update({
      where: { id: actionId },
      data: { status: "error", errorMessage: String(err) }
    });
    // Phase 3: Fail loudly - re-throw so BullMQ can retry
    throw err;
  }
}

async function handleSendEmail(action: any) {
  const step = await prisma.outreachStep.findUnique({ where: { id: action.stepId! } });
  const sequence = await prisma.outreachSequence.findUnique({ where: { id: action.sequenceId } });
  const lead = await prisma.lead.findUnique({ where: { id: sequence!.leadId } });
  if (!lead) return;

  await sendEmailViaGmail({
    to: lead.brandEmail || "",
    subject: `Quick collaboration idea for ${lead.brandName}`,
    text: step?.template || ""
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "contacted" }
  });
}

async function handleFollowUp(action: any) {
  const sequence = await prisma.outreachSequence.findUnique({ where: { id: action.sequenceId } });
  const lead = await prisma.lead.findUnique({ where: { id: sequence!.leadId } });
  if (!lead) return;

  const prev = await prisma.outreachAction.findFirst({
    where: {
      sequenceId: sequence!.id,
      actionType: "send_email"
    },
    orderBy: { createdAt: "desc" }
  });

  const message = await generateFollowUpMessage(prev?.template || "", lead);

  await sendEmailViaGmail({
    to: lead.brandEmail || "",
    subject: `Following up — ${lead.brandName}`,
    text: message
  });
}
