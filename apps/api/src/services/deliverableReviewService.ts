import prisma from "../lib/prisma.js";
import { reviewDeliverable } from "./ai/deliverableReview.js";

// Note: campaignDeliverableAuto model doesn't exist in schema
export async function runDeliverableReview({
  deliverableId,
  content,
  userId
}: {
  deliverableId: string;
  content: string;
  userId?: string;
}) {
  console.warn("Deliverable review not yet implemented - model does not exist");
  throw new Error("Deliverable review feature not yet implemented");
  
  // Original implementation (commented out - model doesn't exist):
  /*
  const deliverable = await prisma.campaignDeliverableAuto.findUnique({
    where: { id: deliverableId },
    include: {
      plan: {
        include: { brief: true }
      }
    }
  });

  if (!deliverable) {
    throw new Error("Deliverable not found");
  }

  */  const result = await reviewDeliverable({
    deliverable,
    content,
    brief: deliverable.plan?.brief
  });

  const review = await prisma.deliverableReview.create({
    data: {
      deliverableId,
      userId,
      aiSummary: result.summary,
      aiIssues: result.issues,
      aiSuggestions: result.suggestions,
      aiScore: result.score,
      status: Array.isArray(result.issues) && result.issues.some((i: any) => i.severity === "high") ? "failed" : "passed"
    }
  });

  return review;
}
