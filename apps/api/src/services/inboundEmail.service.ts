import prisma from "../lib/prisma.js";
import { extractOfferV2, OfferExtractionResult } from "./ai/extractOfferV2.js";
import type { InboundEmail } from "@prisma/client";

export async function runOfferExtractionForEmail(email: InboundEmail): Promise<{
  extraction: OfferExtractionResult;
  drafts: Array<{ id: string }>;
}> {
  const extraction = await extractOfferV2(email);

  // Avoid duplicate drafts when re-running extraction on the same email.
  await prisma.dealDraft.deleteMany({ where: { emailId: email.id } });

  const drafts: Array<{ id: string }> = [];
  for (const option of extraction.options) {
    const deadlineDate = option.deadline ? new Date(option.deadline) : null;
    const draft = await prisma.dealDraft.create({
      data: {
        userId: email.userId,
        emailId: email.id,
        brand: extraction.brandName || email.from || null,
        offerType: option.title || null,
        deliverables: option.deliverables || null,
        paymentAmount: option.amount ?? null,
        currency: option.currency || null,
        deadline: deadlineDate && !Number.isNaN(deadlineDate.getTime()) ? deadlineDate : null,
        exclusivity: option.exclusivity || null,
        usageRights: option.usageRights || null,
        notes: option.launchWindow
          ? `Launch window: ${option.launchWindow.start || "?"} → ${option.launchWindow.end || "?"}`
          : null,
        confidence: extraction.confidence ?? null,
        rawJson: option.meta || extraction.raw || {}
      }
    });
    drafts.push({ id: draft.id });
  }

  return { extraction, drafts };
}
