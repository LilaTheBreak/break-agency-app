import OpenAI from "openai";
import { safeEnv } from "../../utils/safeEnv.js";

const OPENAI_API_KEY = safeEnv("OPENAI_API_KEY", "");
const OPENAI_MODEL = safeEnv("OPENAI_MODEL", "gpt-4o-mini");
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

interface SystemContext {
  tasksDue: number;
  dueTomorrow: number;
  pendingApprovals: number;
  contentDue: number;
  briefsReview: number;
  totalDeals: number;
}

/**
 * Generate AI-powered next steps based on system metrics
 */
export async function generateNextSteps(context: SystemContext): Promise<string[]> {
  // If no OpenAI key, return generic suggestions
  if (!client || !OPENAI_API_KEY) {
    return generateFallbackNextSteps(context);
  }

  try {
    // If there's no data to analyze, return empty
    const hasData = 
      context.tasksDue > 0 || 
      context.dueTomorrow > 0 || 
      context.pendingApprovals > 0 || 
      context.contentDue > 0 || 
      context.briefsReview > 0 || 
      context.totalDeals > 0;

    if (!hasData) {
      return [];
    }

    const prompt = buildNextStepsPrompt(context);

    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract text from response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      return generateFallbackNextSteps(context);
    }

    // Parse the response into individual steps
    const steps = parseNextStepsResponse(content);
    return steps.length > 0 ? steps : generateFallbackNextSteps(context);
  } catch (error) {
    console.error("[AI NEXT STEPS] Error generating suggestions:", error);
    return generateFallbackNextSteps(context);
  }
}

/**
 * Build the prompt for AI to generate next steps
 */
function buildNextStepsPrompt(context: SystemContext): string {
  return `You are an AI assistant for a talent agency CRM. Based on the current system metrics, generate 3-5 actionable next steps for the admin to take.

Current System State:
- Tasks due: ${context.tasksDue}
- Tasks due tomorrow: ${context.dueTomorrow}
- Pending approvals: ${context.pendingApprovals}
- Content waiting for approval: ${context.contentDue}
- Deals in contract stage: ${context.briefsReview}
- Total active deals: ${context.totalDeals}

Generate practical, prioritized next steps that:
1. Address the most urgent items (tasks due, pending approvals)
2. Focus on revenue/deals when relevant
3. Are specific and actionable
4. Are brief (one sentence each)

Format your response as a numbered list with no markdown formatting. Example:
1. Review and approve ${context.pendingApprovals} pending user signups
2. Follow up on ${context.contentDue} overdue deliverables from creators
3. Move ${context.briefsReview} deals forward to proposal stage

Generate only the numbered list, nothing else.`;
}

/**
 * Parse AI response into array of next steps
 */
function parseNextStepsResponse(text: string): string[] {
  const lines = text.split("\n").filter((line) => line.trim());
  
  const steps = lines
    .map((line) => {
      // Remove numbering (1. 2. etc) and clean up
      return line.replace(/^\d+\.\s*/, "").trim();
    })
    .filter((line) => line.length > 0 && line.length < 200); // Reasonable length

  return steps;
}

/**
 * Generate fallback next steps when AI is unavailable
 */
function generateFallbackNextSteps(context: SystemContext): string[] {
  const suggestions: string[] = [];

  // Priority 1: Approvals
  if (context.pendingApprovals > 0) {
    suggestions.push(
      `Review and approve ${context.pendingApprovals} pending user ${context.pendingApprovals === 1 ? "signup" : "signups"}`
    );
  }

  // Priority 2: Due items
  if (context.tasksDue > 0) {
    suggestions.push(
      `Complete ${context.tasksDue} overdue ${context.tasksDue === 1 ? "task" : "tasks"} across all queues`
    );
  }

  if (context.dueTomorrow > 0) {
    suggestions.push(
      `Prepare for ${context.dueTomorrow} ${context.dueTomorrow === 1 ? "task" : "tasks"} due tomorrow`
    );
  }

  // Priority 3: Content/Deals
  if (context.contentDue > 0) {
    suggestions.push(
      `Follow up on ${context.contentDue} deliverables awaiting approval from creators`
    );
  }

  if (context.briefsReview > 0) {
    suggestions.push(
      `Advance ${context.briefsReview} ${context.briefsReview === 1 ? "deal" : "deals"} through contract review`
    );
  }

  // If no data, return empty
  if (suggestions.length === 0) {
    return [];
  }

  // Return up to 5 suggestions
  return suggestions.slice(0, 5);
}
