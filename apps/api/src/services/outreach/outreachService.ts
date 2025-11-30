import prisma from "../../lib/prisma.js";
import { generateOutreachSequence } from "../ai/outreachAIService.js";
import { outreachEngineQueue } from "../../worker/queues.js";

export async function createOutreachForLead(lead: any, user: any) {
  const seq = await prisma.outreachSequence.create({
    data: {
      userId: user.id,
      leadId: lead.id
    }
  });

  const ai = await generateOutreachSequence(lead, user);

  for (let i = 0; i < (ai.steps || []).length; i++) {
    const step = ai.steps[i];

    const newStep = await prisma.outreachStep.create({
      data: {
        sequenceId: seq.id,
        stepNumber: i + 1,
        delayHours: step.delayHours ?? 48,
        template: step.template,
        channel: "email"
      }
    });

    const runAt = new Date(Date.now() + (step.delayHours ?? 48) * 3600_000);

    const action = await prisma.outreachAction.create({
      data: {
        sequenceId: seq.id,
        stepId: newStep.id,
        actionType: "send_email",
        runAt
      }
    });

    await outreachEngineQueue.add("sendOutbound", { actionId: action.id }, { delay: (step.delayHours ?? 48) * 3600_000 });
  }

  return seq;
}
