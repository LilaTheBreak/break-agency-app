import prisma from "../lib/prisma.js";
import { addTimelineEntry } from "./dealTimelineService.js";
import { contractTemplateService } from "./contractTemplateService.js";
import { pdfGenerationService } from "./pdfGenerationService.js";
import { generateId } from "../lib/utils.js";

/**
 * Log contract action to AuditLog
 */
async function logContractAction(
  userId: string,
  action: string,
  contractId: string,
  metadata?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        id: generateId(),
        userId,
        action,
        entityType: "CONTRACT",
        entityId: contractId,
        metadata: metadata || {},
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("[Audit] Failed to log contract action:", error);
  }
}

/**
 * Create contract from deal using template
 */
export async function createFromDeal(dealId: string) {
  const contract = await contractTemplateService.createFromDeal(dealId);

  await addTimelineEntry(dealId, "contract_created", {
    contractId: contract.id,
    title: contract.title
  });

  return contract;
}

/**
 * Generate PDF for contract
 */
export async function generatePDF(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      Deal: {
        include: {
          Brand: true,
          Talent: {
            include: {
              User: true
            }
          }
        }
      }
    }
  });

  if (!contract) {
    throw new Error(`Contract ${id} not found`);
  }

  // Get contract text from terms
  const contractText = await contractTemplateService.getContractText(id);
  
  if (!contractText) {
    throw new Error(`Contract ${id} has no text to generate PDF from`);
  }

  // Generate PDF
  const pdfUrl = await pdfGenerationService.generateAndStore(
    contractText,
    contract.id,
    contract.title
  );

  // Update contract with PDF URL
  const updated = await prisma.contract.update({
    where: { id },
    data: { pdfUrl }
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", "contract_pdf_generated", {
    contractId: contract.id,
    pdfUrl
  });

  return updated;
}

export async function create(data: { dealId?: string; title: string }) {
  const contract = await prisma.contract.create({
    data: {
      id: generateId(),
      dealId: data.dealId,
      title: data.title
    }
  });

  await addTimelineEntry(data.dealId || "no_deal_id", "contract_created", {
    contractId: contract.id,
    title: data.title
  });

  return contract;
}

export async function get(id: string) {
  return prisma.contract.findUnique({ 
    where: { id },
    include: {
      Deal: {
        include: {
          Brand: true,
          Talent: {
            include: {
              User: true
            }
          }
        }
      }
    }
  });
}

export async function update(
  id: string,
  data: { title?: string }
) {
  return prisma.contract.update({
    where: { id },
    data
  });
}

export async function remove(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id }
  });
  
  await prisma.contract.delete({ where: { id } });

  if (contract?.dealId) {
    await addTimelineEntry(contract.dealId, "contract_deleted", {
      contractId: id
    });
  }
}

export async function upload(id: string, fileUrl: string) {
  const contract = await prisma.contract.update({
    where: { id },
    data: { fileUrl }
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", "contract_uploaded", {
    contractId: contract.id,
    fileUrl
  });

  return contract;
}

export async function send(id: string, userId: string = "system") {
  const contract = await prisma.contract.update({
    where: { id },
    data: { status: "sent", sentAt: new Date() }
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", "contract_sent", {
    contractId: contract.id
  });

  // Audit logging
  await logContractAction(userId, "CONTRACT_SENT", contract.id, {
    dealId: contract.dealId,
    status: "sent",
    sentAt: contract.sentAt
  });

  return contract;
}

export async function sign(id: string, signer: string, userId: string = "system") {
  let data: any = {};
  let eventType: string = "";
  let auditAction: string = "";

  if (signer === "talent") {
    data.talentSignedAt = new Date();
    eventType = "contract_signed_talent";
    auditAction = "CONTRACT_SIGNED_TALENT";
    
    // Check if brand already signed
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (existing?.brandSignedAt) {
      data.status = "fully_signed";
      data.fullySignedAt = new Date();
      eventType = "contract_fully_signed";
      auditAction = "CONTRACT_FULLY_SIGNED";
    } else {
      data.status = "partially_signed";
    }
  } else if (signer === "brand") {
    data.brandSignedAt = new Date();
    eventType = "contract_signed_brand";
    auditAction = "CONTRACT_SIGNED_BRAND";
    
    // Check if talent already signed
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (existing?.talentSignedAt) {
      data.status = "fully_signed";
      data.fullySignedAt = new Date();
      eventType = "contract_fully_signed";
      auditAction = "CONTRACT_FULLY_SIGNED";
    } else {
      data.status = "partially_signed";
    }
  } else {
    throw new Error("Invalid signer");
  }

  const contract = await prisma.contract.update({
    where: { id },
    data
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", eventType, {
    contractId: contract.id
  });

  // Audit logging
  await logContractAction(userId, auditAction, contract.id, {
    dealId: contract.dealId,
    signer,
    status: contract.status,
    talentSignedAt: contract.talentSignedAt,
    brandSignedAt: contract.brandSignedAt,
    fullySignedAt: contract.fullySignedAt
  });

  // If fully signed, update deal
  if (contract.status === "fully_signed") {
    await prisma.deal.update({
      where: { id: contract.dealId! },
      data: {
        contractSignedAt: new Date()
      }
    });
  }

  return contract;
}

export async function finalise(id: string, userId: string = "system") {
  const contract = await prisma.contract.update({
    where: { id },
    data: { 
      status: "fully_signed", 
      fullySignedAt: new Date(),
      // Set both signatures to now if not already set
      talentSignedAt: new Date(),
      brandSignedAt: new Date()
    }
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", "contract_fully_signed", {
    contractId: contract.id
  });

  // Audit logging
  await logContractAction(userId, "CONTRACT_FINALIZED", contract.id, {
    dealId: contract.dealId,
    status: "fully_signed",
    fullySignedAt: contract.fullySignedAt
  });

  // Update deal
  if (contract.dealId) {
    await prisma.deal.update({
      where: { id: contract.dealId },
      data: {
        contractSignedAt: new Date()
      }
    });
  }

  return contract;
}

export async function analyse(id: string) {
  // Implement AI analysis logic here
  console.log(`[Contracts] Starting AI analysis for contract ${id}`);
  return;
}

export async function listForDeal(dealId: string) {
  return prisma.contract.findMany({
    where: { dealId },
    orderBy: { createdAt: 'desc' }
  });
}

