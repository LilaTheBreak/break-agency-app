import { aiClient } from '../ai/aiClient.js';

const compliancePrompt = (context: { content: string; policy: any }) => `
You are a strict brand compliance officer. Analyze the provided content against the brand's policy.

**Brand Policy:**
${JSON.stringify(context.policy.rules, null, 2)}

**Content to Analyze:**
"${context.content}"

**Instructions:**
- Score the compliance from 0 (total violation) to 100 (perfectly compliant).
- List all issues found, including their type (e.g., 'PROHIBITED_PHRASE', 'TONE_MISMATCH') and severity.

**JSON Output Schema:**
{ "score": "number", "issues": [{ "type": "string", "message": "string", "severity": "'high' | 'medium' | 'low'" }] }
`;

/**
 * Analyzes content against a brand policy for compliance.
 */
export async function analyzeCompliance(context: { content: string; policy: any }) {
  try {
    const prompt = compliancePrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI COMPLIANCE ANALYZER ERROR]', error);
    return { score: 50, issues: [{ type: 'AI_OFFLINE', message: 'Could not perform AI compliance check.', severity: 'high' }] };
  }
}