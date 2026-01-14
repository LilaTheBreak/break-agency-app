import prisma from '../../lib/prisma.js';
import { generateOutreachSequence } from '../ai/outreachAIService.js';
import { outreachEngineQueue } from '../../worker/queues.js';

export async function createOutreachForLead(lead: any, user: any) {
  const seq = await prisma.outreachSequence.create({
    data: {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      leadId: lead.id,
      name: `Sequence for ${lead.name || lead.id}`,
      updatedAt: new Date()
    }
  });

  const ai = await generateOutreachSequence(lead, user);

  for (let i = 0; i < (ai.data?.steps || []).length; i++) {
    const step = ai.data.steps[i];

    const newStep = await prisma.outreachStep.create({
      data: {
        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sequenceId: seq.id,
        stepNumber: i + 1,
        delay: step.delayHours ?? 48,
        actionType: "email",
        template: step.template,
        updatedAt: new Date()
      }
    });

    const runAt = new Date(Date.now() + (step.delayHours ?? 48) * 3600_000);

    const action = await prisma.outreachAction.create({
      data: {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sequenceId: seq.id,
        stepId: newStep.id,
        actionType: "send_email",
        runAt,
        updatedAt: new Date()
      }
    });

    await outreachEngineQueue.add("sendOutbound", { actionId: action.id }, { delay: (step.delayHours ?? 48) * 3600_000 });
  }

  return seq;
}
