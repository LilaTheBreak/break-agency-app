import { aiClient } from '../../services/ai/aiClient.js';

const qaReviewPrompt = (context: {
  caption: string;
  imageUrl?: string;
  contractRules: any;
  persona: any;
  deliverableMetadata: any;
}) => `
You are a world-class, multi-disciplinary AI Quality Assurance agent for creator content. Your task is to perform a comprehensive review of the provided deliverable.

**Context:**
- **Creator Persona:** ${JSON.stringify(context.persona, null, 2)}
- **Contract Rules:** ${JSON.stringify(context.contractRules, null, 2)}
- **Deliverable Metadata:** ${JSON.stringify(context.deliverableMetadata, null, 2)}

**Content to Analyze:**
- **Caption:** "${context.caption}"
${context.imageUrl ? `- **Image/Video:** (Visual content is present at ${context.imageUrl})` : ''}

**Instructions:**
Analyze the deliverable across multiple vectors and provide a structured JSON report.
1.  **checkContractCompliance**: Does the content meet all contract rules (e.g., required hashtags, mentions, CTA)?
2.  **checkBrandFit**: Does the content's tone and message align with the brand's identity?
3.  **checkPersonaAlignment**: Does the caption sound like the creator's authentic voice?
4.  **detectIssues**: List any specific issues found, their category, severity, and a suggestion for a fix.
5.  **generateImprovements**: Suggest 1-2 alternative captions that are fully compliant and higher performing.
6.  **scoreContent**: Provide an overall quality score from 0-100.

**JSON Output Schema:**
{
  "overallScore": "number (0-100)",
  "summary": "A one-sentence summary of the QA check.",
  "issues": [
    {
      "category": "'Compliance' | 'Brand Fit' | 'Persona' | 'Safety'",
      "description": "string",
      "severity": "'high' | 'medium' | 'low'"
    }
  ],
  "improvements": { "suggestedCaptions": ["string"] }
}
`;

/**
 * Runs a full QA review on a deliverable using the AI client.
 */
export async function runQAReview(context: any) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[AI QA STUB] OPENAI_API_KEY not found. Returning stubbed QA report.');
    return { overallScore: 75, summary: 'Stubbed QA report due to missing API key.', issues: [], improvements: { suggestedCaptions: [context.caption] } };
  }
  const prompt = qaReviewPrompt(context);
  return aiClient.json(prompt);
}