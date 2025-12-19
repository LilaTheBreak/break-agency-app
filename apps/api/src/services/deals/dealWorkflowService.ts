import prisma from "../../lib/prisma.js";

/**
 * Handles deal workflow actions (status updates, advancing stages, etc.)
 * This is a placeholder implementation so the server can run.
 */

export async function advanceDealStage(dealId: string, nextStage: string, userId?: string) {
  console.log("[dealWorkflowService] advanceDealStage called:", { dealId, nextStage, userId });

  try {
    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        stage: nextStage as any,
        updatedAt: new Date()
      }
    });

    return { ok: true, data: updated };
  } catch (error) {
    console.error("[dealWorkflowService] Error:", error);
    return { ok: false, error: "Failed to advance deal stage" };
  }
}

export async function getWorkflowStatus(dealId: string) {
  console.log("[dealWorkflowService] getWorkflowStatus called:", dealId);

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, stage: true, updatedAt: true }
    });

    if (!deal) return { ok: false, error: "Deal not found" };

    return { ok: true, data: deal };
  } catch (error) {
    console.error("[dealWorkflowService] Error:", error);
    return { ok: false, error: "Failed to fetch workflow status" };
  }
}

export async function logWorkflowEvent(dealId: string, message: string, userId?: string) {
  console.log("[dealWorkflowService] logWorkflowEvent called:", { dealId, message });

  try {
    const event = await prisma.dealTimeline.create({
      data: {
        dealId,
        type: "workflow",
        message,
        createdById: userId ?? null
      }
    });

    return { ok: true, data: event };
  } catch (error) {
    console.error("[dealWorkflowService] Error:", error);
    return { ok: false, error: "Failed to log workflow event" };
  }
}
