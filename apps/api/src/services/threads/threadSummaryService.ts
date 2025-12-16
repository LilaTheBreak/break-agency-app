import prisma from "../../lib/prisma";

/**
 * Generates a simple thread summary placeholder.
 * This is a stub implementation so the API can run without errors.
 */
export async function getThreadSummary(threadId: string) {
  console.log("[threadSummaryService] getThreadSummary called:", threadId);

  try {
    const lastEmail = await prisma.inboundEmail.findFirst({
      where: { threadId },
      orderBy: { receivedAt: "desc" }
    });

    return {
      ok: true,
      summary: lastEmail?.subject ?? "No summary available",
      lastMessageAt: lastEmail?.receivedAt ?? null,
    };
  } catch (err) {
    console.error("[threadSummaryService] Error:", err);
    return {
      ok: false,
      error: "Failed to summarise thread"
    };
  }
}
