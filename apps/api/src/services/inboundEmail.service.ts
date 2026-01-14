import prisma from '../lib/prisma.js';
import { extractOfferV2, OfferExtractionResult } from './ai/extractOfferV2.js';
import type { InboundEmail } from "@prisma/client";

export async function runOfferExtractionForEmail(email: InboundEmail): Promise<{
  extraction: OfferExtractionResult;
  drafts: Array<{ id: string }>;
}> {
  const extraction = await extractOfferV2(email);

  // TODO: Implement offer extraction and draft creation once DealDraft schema is finalized
  // For now, store extraction data in the data field of DealDraft
  const drafts: Array<{ id: string }> = [];
  
  try {
    for (const option of extraction.options) {
      const draft = await prisma.dealDraft.create({
        data: {
          userId: email.userId || "",
          data: {
            brandName: extraction.brandName,
            title: option.title,
            deliverables: option.deliverables,
            amount: option.amount,
            currency: option.currency,
            deadline: option.deadline,
            emailId: email.id,
          },
        },
      });
      drafts.push({ id: draft.id });
    }
  } catch (error) {
    console.error("[OfferExtraction] Error creating drafts:", error);
  }

  return { extraction, drafts };
}
