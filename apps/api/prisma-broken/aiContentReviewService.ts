import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const draftReviewPrompt = (context: {
  caption: string;
  videoUrl?: string;
  creativeBrief: any;
  brandGuidelines: any;
}) => `
You are an AI Creative Director with an expert eye for detail. Your task is to review a draft deliverable (video and caption) and provide structured, actionable feedback.

**Creative Brief:**
${JSON.stringify(context.creativeBrief, null, 2)}

**Brand Guidelines:**
${JSON.stringify(context.brandGuidelines, null, 2)}

**Content to Review:**
- **Caption:** "${context.caption}"
- **Video:** (A video is present at the URL: ${context.videoUrl || 'N/A'})

**Instructions:**
Generate a comprehensive review in a structured JSON format.
1.  **analyzeDraft**: Review the video and caption against the brief and guidelines.
2.  **generateChangeRequests**: Create a list of specific, actionable change requests. For video, use timestamps (e.g., "0:15 - Product logo is not clearly visible").
3.  **detectComplianceIssues**: List any compliance failures (e.g., missing #ad, use of forbidden words).
4.  **predictPerformance**: Predict the performance tier ('A' to 'F') and suggest one key improvement.
5.  **generateRewriteSuggestions**: Offer 2-3 improved versions of the caption.
6.  **summarizeForBrand**: Write a polite, high-level summary for the brand, highlighting that the content is in internal review to ensure it's perfect.
7.  **summarizeForTalent**: Write a constructive, encouraging summary for the creator, outlining the key feedback points.

**JSON Output Schema:**
{
  "aiDraftReview": {
    "overallAssessment": "string",
    "score": "number (0-100)"
  },
  "aiTimestampNotes": [
    { "timestamp": "string (e.g., 0:05)", "note": "string" }
  ],
  "aiSuggestions": {
    "changeRequests": ["string"],
    "rewrites": ["string"]
  },
  "aiCompliance": {
    "issues": ["string"]
  },
  "aiPerformancePrediction": {
    "tier": "string",
    "keyImprovement": "string"
  },
  "aiBrandSummary": "string",
  "aiTalentSummary": "string"
}
`;

/**
 * The main orchestrator for the AI draft review pipeline.
 * @param deliverableId - The ID of the DeliverableItem to review.
 */
export async function reviewDraft(deliverableId: string) {
  // 1. Load Context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: { deal: { include: { dealDraft: true } } },
  });

  if (!deliverable) {
    throw new Error('Deliverable not found for review.');
  }

  // 2. Run AI Review
  const result = await aiClient.json(draftReviewPrompt({
    caption: deliverable.caption || '',
    videoUrl: deliverable.fileId, // Assuming fileId is a URL
    creativeBrief: deliverable.aiContentBrief || {},
    brandGuidelines: (deliverable.deal.dealDraft?.notes as any) || {},
  })) as any;

  // 3. Save the structured review to the DeliverableItem
  const updatedDeliverable = await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: {
      aiDraftReview: result.aiDraftReview,
      aiTimestampNotes: result.aiTimestampNotes,
      aiSuggestions: result.aiSuggestions,
      aiRewrite: { suggestions: result.aiSuggestions.rewrites },
      aiCompliance: result.aiCompliance,
      aiBrandSummary: result.aiBrandSummary,
      aiTalentSummary: result.aiTalentSummary,
      aiQaPerformance: result.aiPerformancePrediction, // Re-using this field
      aiQaStatus: 'review_completed',
    },
  });

  console.log(`[AI DRAFT REVIEW] Successfully reviewed draft for deliverable ${deliverableId}.`);
  return updatedDeliverable;
}