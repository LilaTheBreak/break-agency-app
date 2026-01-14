import prisma from './prisma.js';

/**
 * AI History Logger
 * 
 * Logs AI interactions to AIPromptHistory for audit and analytics.
 * 
 * Note: AIPromptHistory requires creatorId (Talent.id), so we need to
 * find the Talent record associated with the userId.
 */

export interface AIHistoryLog {
  userId: string;
  prompt: string;
  response: string;
  category: string;
  metadata?: any;
}

/**
 * Logs an AI interaction to history
 * 
 * @param log - The AI interaction data to log
 * @returns Promise that resolves when logging is complete
 */
export async function logAIHistory(log: AIHistoryLog): Promise<void> {
  try {
    // Find Talent record associated with userId
    const talent = await prisma.talent.findUnique({
      where: { userId: log.userId },
      select: { id: true }
    });

    // Only log if user has an associated Talent record
    // (AIPromptHistory requires creatorId)
    if (talent) {
      await prisma.aIPromptHistory.create({
        data: {
          id: `history-${Date.now()}`,
          creatorId: talent.id,
          prompt: log.prompt,
          response: log.response,
          category: log.category
        }
      });
    } else {
      // For non-talent users (admin, agent, etc.), we could create a separate log
      // For now, we'll just skip logging (or could extend schema later)
      console.log(`[AI History] Skipping log for non-talent user: ${log.userId}`);
    }
  } catch (error) {
    // Don't fail the AI request if history logging fails
    console.error("[AI History] Failed to log AI interaction:", error);
  }
}

/**
 * Logs AI interaction with automatic prompt/response extraction
 * 
 * @param userId - User ID
 * @param userInput - User's input/prompt
 * @param aiResponse - AI's response
 * @param category - Category of AI interaction (e.g., "assistant", "reply", "extraction")
 * @param metadata - Optional metadata
 */
export async function logAIInteraction(
  userId: string,
  userInput: string,
  aiResponse: string,
  category: string,
  metadata?: any
): Promise<void> {
  await logAIHistory({
    userId,
    prompt: userInput,
    response: aiResponse,
    category,
    metadata
  });
}

