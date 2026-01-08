import prisma from "../lib/prisma.js";
import { reviewDeliverable } from "./ai/deliverableReview.js";

// Note: deliverableReview model doesn't exist in schema
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
}
