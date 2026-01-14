import prisma from '../lib/prisma';

/**
 * Tracks AI token consumption per request.
 * Logs token usage to the AiTokenLog table.
 */
export async function trackAITokens(
  service: string,
  tokens: number,
  meta: {
    model?: string;
    userId?: string;
  } = {}
) {
  try {
    await prisma.aiTokenLog.create({
      data: {
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: meta.userId || null,
        action: service,
        model: meta.model || "unknown",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: tokens,
        estimatedCost: (tokens / 1_000_000) * 1, // placeholder
      },
    });

    return {
      ok: true,
      data: { service, tokens },
      meta,
    };
  } catch (error) {
    console.error("Failed to track AI tokens:", error);

    return {
      ok: false,
      data: null,
      meta: { error: String(error) },
    };
  }
}
