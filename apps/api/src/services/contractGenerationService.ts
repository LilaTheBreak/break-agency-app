import prisma from "../lib/prisma.js";
import { buildContractFromTerms } from "./contractBuilder.js";
import { uploadBufferToS3 } from "./s3Upload.js";

export async function generateContract(userId: string, dealId: string | null, threadId: string | null, terms: any) {
  const { html, pdf } = await buildContractFromTerms(terms);

  const contract = await prisma.contract.create({
    data: {
      userId,
      dealId: dealId || undefined,
      threadId: threadId || undefined,
      terms,
      status: "awaiting_approval"
    }
  });

  const key = `contracts/${contract.id}.pdf`;
  const pdfUrl = await uploadBufferToS3(pdf, key);

  await prisma.contract.update({
    where: { id: contract.id },
    data: { pdfUrl }
  });

  return { contract, html, pdfUrl };
}
