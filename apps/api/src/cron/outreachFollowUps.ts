import prisma from "../lib/prisma.js";
import { outreachEngineQueue } from "../worker/queues.js";

export async function generateFollowUps() {
  const sequences = await prisma.outreachSequence.findMany({
    where: { status: "active" }
  });

  for (const seq of sequences) {
    const recent = await prisma.outreachAction.findMany({
      where: {
        sequenceId: seq.id,
        status: "completed"
      },
      orderBy: { createdAt: "desc" },
      take: 1
    });

    const last = recent[0];
    if (!last) continue;

    if (Date.now() - last.createdAt.getTime() > 72 * 3600_000) {
      const action = await prisma.outreachAction.create({
        data: {
          id: `action-${Date.now()}`,
          sequenceId: seq.id,
          actionType: "follow_up",
          status: "pending",
          runAt: new Date(),
          updatedAt: new Date()
        }
      });

      await outreachEngineQueue.add("followUp", { actionId: action.id });
    }
  }
}
