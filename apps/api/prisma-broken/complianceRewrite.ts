import { aiClient } from '../ai/aiClient.js';

const rewritePrompt = (context: { content: string; issues: any[] }) => `
You are an expert copy editor. Rewrite the following content to fix the specified compliance issues.

**Original Content:**
"${context.content}"

**Issues to Fix:**
${JSON.stringify(context.issues, null, 2)}

**JSON Output Schema:**
{ "suggestedContent": "string", "explanation": "string explaining the changes" }
`;

/**
 * Rewrites content to make it compliant with brand policy.
 */
export async function rewriteForCompliance(context: { content: string; issues: any[] }) {
  try {
    const prompt = rewritePrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI COMPLIANCE REWRITE ERROR]', error);
    return { suggestedContent: context.content, explanation: 'AI rewrite is offline.' };
  }
}