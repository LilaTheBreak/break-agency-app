import { aiClient } from '../../services/ai/aiClient.js';

const qaPrompt = (context: {
  caption: string;
  brandGuidelines: any;
  briefRequirements: any;
}) => `
You are a world-class AI Quality Assurance agent for creator content. Your task is to perform a comprehensive review of the provided deliverable.

**Brand Guidelines:**
${JSON.stringify(context.brandGuidelines, null, 2)}

**Campaign Brief:**
${JSON.stringify(context.briefRequirements, null, 2)}

**Deliverable Caption:**
"${context.caption}"

**Instructions:**
Analyze the deliverable across multiple vectors and provide a structured JSON report.
1.  **qaScanCompliance**: Check for necessary disclosures like #ad. Score from 0-100.
2.  **qaScanBrandSafety**: Check for negative sentiment, controversial topics, or off-brand language. Score from 0-100.
3.  **qaScanBriefAlignment**: Check if the content meets all requirements from the campaign brief. Score from 0-100.
4.  **qaPredictPerformance**: Predict the likely performance tier ('A' to 'F').
5.  **qaGenerateFixes**: Identify specific issues and suggest concrete fixes or rewrites for the caption.
6.  **qaBuildFinalReport**: Compile all findings into an overall score and a brief summary.

**JSON Output Schema:**
{
  "overallScore": "number (0-100)",
  "summary": "string",
  "risks": [
    {
      "category": "'Compliance' | 'Brand Safety' | 'Brief Alignment'",
      "description": "string",
      "severity": "'high' | 'medium' | 'low'"
    }
  ],
  "performancePrediction": { "tier": "'A'|'B'|'C'|'D'|'F'", "reasoning": "string" },
  "suggestedFixes": [
    { "issue": "string", "suggestion": "string" }
  ]
}
`;

/**
 * The main orchestrator for the deliverable QA pipeline.
 * @param deliverable - The deliverable object from Prisma.
 */
export async function qaAnalyzeDeliverable(deliverable: any) {
  // In a real app, you would fetch brand guidelines and brief requirements dynamically.
  const context = {
    caption: deliverable.caption || '',
    brandGuidelines: { requiredHashtags: ['#BrandX'], forbiddenWords: ['cheap'] },
    briefRequirements: { cta: 'Link in bio' },
  };

  if (!context.caption) {
    throw new Error('Deliverable has no caption to analyze.');
  }

  try {
    return await aiClient.json(qaPrompt(context));
  } catch (error) {
    console.error('[AI DELIVERABLE QA ENGINE ERROR]', error);
    throw new Error('Failed to analyze deliverable with AI.');
  }
}