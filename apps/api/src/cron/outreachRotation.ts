import prisma from "../lib/prisma.js";
import { enqueueAIAgentTask } from "../worker/enqueueAIAgentTask.js";

export async function runOutreachRotation() {
  const talents = await prisma.talent.findMany({
    where: {
      aiSettings: {
        isNot: null
      }
    },
    include: {
      aiSettings: true,
      outboundTemplates: true
    }
  });

  let queued = 0;
  for (const talent of talents) {
    if (!talent.aiSettings?.outreachEnabled) continue;
    const template = talent.outboundTemplates.find((t) => t.enabled);
    if (!template) continue;

    await enqueueAIAgentTask({
      type: "OUTREACH",
      talentId: talent.id,
      payload: { templateId: template.id }
    });
    queued += 1;
  }
  return { queued };
}
