import prisma from "../lib/prisma";
import { addTimelineEntry } from "./dealTimelineService";

export async function create(data: { dealId?: string; title: string }) {
  const contract = await prisma.contract.create({
    data: {
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
  return prisma.contract.findUnique({ where: { id } });
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
  await prisma.contract.delete({ where: { id } });
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

export async function send(id: string) {
  const contract = await prisma.contract.update({
    where: { id },
    data: { status: "sent", sentAt: new Date() }
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", "contract_sent", {
    contractId: contract.id
  });

  return contract;
}

export async function sign(id: string, signer: string) {
  let data: any = {};
  let eventType: string = "";

  if (signer === "talent") {
    data.status = "signed_by_talent";
    data.talentSignedAt = new Date();
    eventType = "contract_signed_talent";
  } else if (signer === "brand") {
    data.status = "signed_by_brand";
    data.brandSignedAt = new Date();
    eventType = "contract_signed_brand";
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

  return contract;
}

export async function finalise(id: string) {
  const contract = await prisma.contract.update({
    where: { id },
    data: { status: "fully_signed", fullySignedAt: new Date() }
  });

  await addTimelineEntry(contract.dealId || "no_deal_id", "contract_fully_signed", {
    contractId: contract.id
  });

  // In a real application, you would also update the deal stage here.

  return contract;
}

export async function analyse(id: string) {
  // Implement AI analysis logic here
  console.log(`[Contracts] Starting AI analysis for contract ${id}`);
  return;
}

export async function listForDeal(dealId: string) {
  return prisma.contract.findMany({
    where: { dealId }
  });
}
