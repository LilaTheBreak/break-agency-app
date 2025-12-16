import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

interface ReconstructionInput {
  emailId: string;
  threadId?: string;
}

const reconstructionPrompt = (context: any) => `
Analyze the provided email thread context and reconstruct the commercial offer into a structured JSON object.

**Context:**
- Brand: ${context.brandName}
- Thread Subject: ${context.subject}
- Full Email Body:
---
${context.body}
---

**Instructions:**
Extract the following fields. If a field is not mentioned, use null.

**JSON Output Schema:**
{
  "offerValue": "number | null, the total monetary value of the offer",
  "offerCurrency": "string | null, e.g., 'GBP', 'USD', 'EUR'",
  "deliverablesRaw": "string | null, a direct quote of the deliverables section",
  "deliverables": "[{ 'type': 'e.g., Video, Story, Post', 'platform': 'e.g., TikTok, Instagram', 'count': 'number', 'notes': 'string' }]",
  "usageRights": "{ 'type': 'e.g., In-perpetuity, Paid Media', 'duration': 'e.g., 6 months', 'region': 'e.g., Global' } | null",
  "exclusivityTerms": "[{ 'category': 'e.g., Competing Brands, All Beverages', 'duration': 'e.g., 30 days' }] | null",
  "keyDates": "{ 'dueDate': 'YYYY-MM-DD', 'campaignLaunch': 'YYYY-MM-DD', 'postingWindow': 'string' } | null",
  "contractLength": "string | null, e.g., '12 months'",
  "revisionPolicy": "string | null, e.g., '2 rounds of revisions'",
  "risks": "[string] | null, potential red flags or unclear terms",
  "aiConfidence": "number, 0.0 to 1.0, your confidence in the accuracy of the extraction"
}
`;

/**
 * Reconstructs a deal from an email's content using AI.
 * @param {ReconstructionInput} input - The email and thread context.
 */
export async function reconstructDealDraft({ emailId, threadId }: ReconstructionInput) {
  const email = await prisma.inboundEmail.findUnique({ where: { id: emailId } });
  if (!email) throw new Error('Email not found');

  // In a real scenario, we'd gather more context from the thread, user, talent settings, etc.
  const context = {
    brandName: email.aiBrand || 'Unknown',
    subject: email.subject,
    body: email.body,
  };

  const prompt = reconstructionPrompt(context);
  let extractedData: any;
  let logData: any = { emailId, threadId };

  try {
    extractedData = await aiClient.json(prompt);

    // Find or create the DealDraft to update
    let dealDraft = await prisma.dealDraft.findFirst({ where: { emailId } });
    if (!dealDraft) {
      dealDraft = await prisma.dealDraft.create({
        data: { userId: email.userId, emailId, brand: email.aiBrand },
      });
    }

    // Update the draft with the new, structured data
    const updatedDraft = await prisma.dealDraft.update({
      where: { id: dealDraft.id },
      data: {
        offerValue: extractedData.offerValue,
        offerCurrency: extractedData.offerCurrency,
        deliverablesRaw: extractedData.deliverablesRaw,
        deliverables: extractedData.deliverables,
        usageRights: extractedData.usageRights,
        exclusivityTerms: extractedData.exclusivityTerms,
        keyDates: extractedData.keyDates,
        contractLength: extractedData.contractLength,
        revisionPolicy: extractedData.revisionPolicy,
        risks: extractedData.risks,
        aiConfidence: extractedData.aiConfidence,
      },
    });

    logData.extracted = extractedData;
    logData.confidence = extractedData.aiConfidence;

    // STUB for S22
    // await negotiationInsightService.generate(updatedDraft.id);

    return { draft: updatedDraft, log: logData };
  } catch (error: any) {
    console.error('[DEAL RECONSTRUCTION ERROR]', error);
    logData.issues = { error: error.message };
    throw error;
  } finally {
    await prisma.dealExtractionLog.create({ data: logData });
  }
}