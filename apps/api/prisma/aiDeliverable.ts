import { aiClient } from './aiClient.js';

const qaPrompt = (context: {
  caption: string;
  brandGuidelines: any;
  briefRequirements: any;
}) => `
You are a comprehensive AI Quality Assurance agent for creator content. Analyze the provided deliverable caption against all known requirements.

**Brand Guidelines:**
${JSON.stringify(context.brandGuidelines, null, 2)}

**Campaign Brief Requirements:**
${JSON.stringify(context.briefRequirements, null, 2)}

**Content Caption to Analyze:**
"${context.caption}"

**Instructions:**
Provide a full analysis in a structured JSON format.
1.  **Scores**: Provide scores (0-100) for alignment with brand guidelines, brief requirements, legal compliance (e.g., #ad), and brand safety.
2.  **Issues**: List all specific issues found, their type, severity, and a suggestion for how to fix it.
3.  **Rewrites**: Generate 2-3 alternative, fully compliant versions of the caption.
4.  **Performance**: Predict the performance tier ('A' to 'F') for the original caption.

**JSON Output Schema:**
{
  "scores": {
    "brandGuidelinesScore": "number",
    "briefRequirementsScore": "number",
    "complianceScore": "number",
    "brandSafetyScore": "number"
  },
  "issues": [{
    "type": "'BRAND_GUIDELINE' | 'BRIEF_MISMATCH' | 'COMPLIANCE_RISK' | 'BRAND_SAFETY'",
    "description": "string",
    "severity": "'high' | 'medium' | 'low'",
    "suggestion": "string"
  }],
  "suggestedRewrites": ["string"],
  "predictedPerformance": { "tier": "string" }
}
`;

/**
 * Runs the full AI QA suite on a deliverable's content.
 */
export async function analyzeDeliverable(context: any) {
  try {
    const prompt = qaPrompt(context);
    return await aiClient.json(prompt);
  } catch (error) {
    console.error('[AI DELIVERABLE QA ERROR]', error);
    return {
      scores: { brandGuidelinesScore: 0, briefRequirementsScore: 0, complianceScore: 0, brandSafetyScore: 0 },
      issues: [{ type: 'AI_OFFLINE', description: 'The AI analysis engine is offline.', severity: 'high', suggestion: 'Please review manually.' }],
      suggestedRewrites: [context.caption],
      predictedPerformance: { tier: 'N/A' },
    };
  }
}