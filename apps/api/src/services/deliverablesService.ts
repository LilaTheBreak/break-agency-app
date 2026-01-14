import prisma from '../lib/prisma.js';
import { addTimelineEntry } from './dealTimelineService.js';
import { generateId } from '../lib/utils.js';

export async function create(data: {
  dealId: string;
  title: string;
  description?: string;
  deliverableType?: string;
  usageRights?: string;
  frequency?: string;
  dueAt?: Date;
}) {
  const deliverable = await prisma.deliverable.create({
    data: {
      id: generateId(),
      dealId: data.dealId,
      title: data.title,
      description: data.description,
      deliverableType: data.deliverableType,
      usageRights: data.usageRights,
      frequency: data.frequency,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      updatedAt: new Date()
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
  data: { 
    title?: string; 
    description?: string; 
    dueAt?: Date;
    deliverableType?: string;
    usageRights?: string;
    frequency?: string;
  }
) {
  const existingDeliverable = await prisma.deliverable.findUnique({ where: { id } });

  if (!existingDeliverable) {
    return null;
  }

  const updatedDeliverable = await prisma.deliverable.update({
    where: { id },
    data: {
      ...data,
      dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      updatedAt: new Date()
    }
  });

  if (data.dueAt && data.dueAt.toString() !== existingDeliverable.dueAt?.toString()) {
    await addTimelineEntry(existingDeliverable.dealId, "deliverable_due_date_changed", {
      deliverableId: id,
      oldDueDate: existingDeliverable.dueAt,
      newDueDate: data.dueAt
    });
  }

  return updatedDeliverable;
}

export async function remove(id: string) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id }
  });
  
  if (deliverable) {
    await addTimelineEntry(deliverable.dealId, "deliverable_deleted", {
      deliverableId: id,
      title: deliverable.title
    });
  }
  
  await prisma.deliverable.delete({ where: { id } });
}

/**
 * Upload proof of completion file
 * Associates file with deliverable via DeliverableItem or metadata
 */
export async function uploadProof(id: string, fileUrl: string, fileName: string) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id }
  });

  if (!deliverable) {
    throw new Error(`Deliverable ${id} not found`);
  }

  // Create DeliverableItem to track the file upload
  const item = await prisma.deliverableItem.create({
    data: {
      id: generateId(),
      dealId: deliverable.dealId,
      title: `Proof: ${fileName}`,
      description: `Uploaded proof for ${deliverable.title}`,
      deliverableType: deliverable.deliverableType,
      status: "submitted",
      metadata: {
        deliverableId: id,
        fileUrl,
        fileName,
        uploadedAt: new Date().toISOString()
      },
      updatedAt: new Date()
    }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_proof_uploaded", {
    deliverableId: id,
    deliverableItemId: item.id,
    title: deliverable.title,
    fileUrl,
    fileName
  });

  return item;
}

/**
 * Approve a deliverable
 */
export async function approve(id: string, approverUserId?: string) {
  const deliverable = await prisma.deliverable.update({
    where: { id },
    data: { 
      approvedAt: new Date(),
      updatedAt: new Date()
    }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_approved", {
    deliverableId: id,
    title: deliverable.title,
    approverUserId
  });

  // Check if all deliverables are approved and advance the deal stage
  await checkIfAllDeliverablesApproved(deliverable.dealId);

  return deliverable;
}

/**
 * Request revision on a deliverable
 */
export async function requestRevision(id: string, reason?: string, reviewerUserId?: string) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id }
  });

  if (!deliverable) {
    throw new Error(`Deliverable ${id} not found`);
  }

  // Clear approval if previously approved
  await prisma.deliverable.update({
    where: { id },
    data: {
      approvedAt: null,
      updatedAt: new Date()
    }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_revision_requested", {
    deliverableId: id,
    title: deliverable.title,
    reason,
    reviewerUserId
  });

  return deliverable;
}

/**
 * Reject a deliverable
 */
export async function reject(id: string, reason?: string, reviewerUserId?: string) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id }
  });

  if (!deliverable) {
    throw new Error(`Deliverable ${id} not found`);
  }

  // Update all associated DeliverableItems to rejected
  await prisma.deliverableItem.updateMany({
    where: {
      dealId: deliverable.dealId,
      metadata: {
        path: ['deliverableId'],
        equals: id
      }
    },
    data: {
      status: 'rejected',
      updatedAt: new Date()
    }
  });

  await addTimelineEntry(deliverable.dealId, "deliverable_rejected", {
    deliverableId: id,
    title: deliverable.title,
    reason,
    reviewerUserId
  });

  return deliverable;
}

export async function getByDeal(dealId: string) {
  return prisma.deliverable.findMany({ 
    where: { dealId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getItemsForDeliverable(deliverableId: string) {
  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId }
  });

  if (!deliverable) {
    return [];
  }

  return prisma.deliverableItem.findMany({
    where: {
      dealId: deliverable.dealId,
      metadata: {
        path: ['deliverableId'],
        equals: deliverableId
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function checkIfAllDeliverablesApproved(dealId: string) {
  const deliverables = await prisma.deliverable.findMany({ where: { dealId } });
  
  if (deliverables.length === 0) {
    return false;
  }

  const allApproved = deliverables.every((d) => d.approvedAt !== null);

  if (allApproved) {
    await advanceDealStageWhenAppropriate(dealId);
  }

  return allApproved;
}

export async function advanceDealStageWhenAppropriate(dealId: string) {
  // Mark deliverables as completed on the deal
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      deliverablesCompletedAt: new Date()
    }
  });

  await addTimelineEntry(dealId, "all_deliverables_approved", {
    message: "All deliverables have been approved"
  });

  console.log(`[Deliverables] All deliverables approved for deal ${dealId}. Deal updated.`);
}
