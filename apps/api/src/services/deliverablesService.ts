import prisma from "../lib/prisma.js";
import { addTimelineEntry } from "./dealTimelineService.js";

export async function create(data: {
  dealId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}) {
  const deliverable = await prisma.deliverable.create({
    data: {
      dealId: data.dealId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }
  });

  await addTimelineEntry(data.dealId, "deliverable_created", {
    deliverableId: deliverable.id,
    title: data.title
  });

  return deliverable;
}

export async function get(id: string) {
  return prisma.deliverable.findUnique({ where: { id } });
}

export async function update(
  id: string,
  data: { title?: string; description?: string; dueDate?: Date }
) {
  const existingDeliverable = await prisma.deliverable.findUnique({ where: { id } });

  if (!existingDeliverable) {
    return null;
  }

  const updatedDeliverable = await prisma.deliverable.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }
  });

  if (data.dueDate && data.dueDate.toString() !== existingDeliverable.dueDate?.toString()) {
    await addTimelineEntry(existingDeliverable.dealId, "deliverable_due_date_changed", {
      deliverableId: id,
      oldDueDate: existingDeliverable.dueDate,
      newDueDate: data.dueDate
    });
  }

  return updatedDeliverable;
}

export async function remove(id: string) {
  await prisma.deliverable.delete({ where: { id } });
}

export async function submit(id: string) {
  const deliverable = await prisma.deliverable.update({
    where: { id },
    data: { status: "submitted", submittedAt: new Date() }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_submitted", {
    deliverableId: id,
    title: deliverable.title
  });

  return deliverable;
}

export async function requestRevision(id: string) {
  const deliverable = await prisma.deliverable.update({
    where: { id },
    data: { status: "revision_requested" }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_revision_requested", {
    deliverableId: id,
    title: deliverable.title
  });

  return deliverable;
}

export async function approve(id: string) {
  const deliverable = await prisma.deliverable.update({
    where: { id },
    data: { status: "approved", approvedAt: new Date() }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_approved", {
    deliverableId: id,
    title: deliverable.title
  });

  // Check if all deliverables are approved and advance the deal stage
  await checkIfAllDeliverablesApproved(deliverable.dealId);

  return deliverable;
}

export async function getByDeal(dealId: string) {
  return prisma.deliverable.findMany({ where: { dealId } });
}

export async function checkIfAllDeliverablesApproved(dealId: string) {
  const deliverables = await prisma.deliverable.findMany({ where: { dealId } });
  const allApproved = deliverables.every((d) => d.status === "approved");

  if (allApproved) {
    await advanceDealStageWhenAppropriate(dealId);
  }
}

export async function advanceDealStageWhenAppropriate(dealId: string) {
  // In a real application, you would call a dealWorkflowService here
  // to advance the deal to the next stage (e.g., "Payment Pending").
  console.log(`[Deliverables] All deliverables approved for deal ${dealId}.  Implement dealWorkflowService to advance deal stage.`);
}