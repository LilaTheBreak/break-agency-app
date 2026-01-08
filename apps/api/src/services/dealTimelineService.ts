import prisma from "../db/client.js";

/**
 * Add event to deal timeline
 */
export async function addEvent(dealId: string, data: { type: string; message: string; metadata?: any; createdById: string }) {
  try {
    const event = await prisma.dealTimeline.create({
      data: {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealId,
        type: data.type,
        message: data.message,
        metadata: data.metadata,
        createdById: data.createdById,
      },
    });
    return event;
  } catch (error) {
    console.error("Failed to add timeline event:", error);
    throw error;
  }
}

/**
 * Get timeline for deal
 */
export async function getTimelineForDeal(dealId: string) {
  try {
    const timeline = await prisma.dealTimeline.findMany({
      where: { dealId },
      include: { User: true },
      orderBy: { createdAt: 'desc' },
    });
    return timeline;
  } catch (error) {
    console.error("Failed to fetch deal timeline:", error);
    return [];
  }
}

/**
 * Writes an entry to the deal timeline.
 */
export async function addTimelineEntry(dealId: string, type: string, metadata?: any) {
  const message = typeof type === 'string' ? type : JSON.stringify(type);
  return {
    ok: true,
    dealId,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
}
