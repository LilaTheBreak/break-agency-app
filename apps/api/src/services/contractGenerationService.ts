import prisma from '../lib/prisma';
import { buildContractFromTerms } from './contractBuilder';
import { uploadBufferToS3 } from './s3Upload';

export async function generateContract(userId: string, dealId: string | null, threadId: string | null, terms: any) {
  let html = "";
  let pdf = "";

  try {
    const result: any = await buildContractFromTerms(terms);
    if (result && typeof result === 'object') {
      html = result.html || "";
      pdf = result.pdf || "";
    }
  } catch (err) {
    console.warn("Contract generation not available:", err);
  }

  const contract = await prisma.contract.create({
    data: {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dealId: dealId || "",
      title: `Contract for deal ${dealId}`,
      terms: terms as any,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  let pdfUrl = "";
  if (pdf) {
    const key = `contracts/${contract.id}.pdf`;
    pdfUrl = await uploadBufferToS3(Buffer.from(pdf), key);

    await prisma.contract.update({
      where: { id: contract.id },
      data: { pdfUrl }
    });
  }

  return { contract, html, pdfUrl };
}
