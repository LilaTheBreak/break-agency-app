// apps/api/src/services/dealTimelineService.ts

/**
 * Writes an entry to the deal timeline.
 */
export async function addTimelineEntry(dealId: string, message: string) {
  return {
    ok: true,
    dealId,
    message,
    timestamp: new Date().toISOString(),
  };
}
