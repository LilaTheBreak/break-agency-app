import prisma from "../../lib/prisma.js";
import { docusignProvider } from "./providers/docusignProvider.js";
import { nativeProvider } from "./providers/nativeProvider.js";

function providerFromEnv() {
  return process.env.SIGN_PROVIDER === "docusign" ? docusignProvider : nativeProvider;
}

export async function initiateSignature(contract: any) {
  const provider = providerFromEnv();

  const record = await prisma.signatureRequest.create({
    data: {
      contractId: contract.id,
      provider: process.env.SIGN_PROVIDER || "native",
      signerEmail: (contract.terms as any)?.brandEmail || "brand@example.com",
      signerName: (contract.terms as any)?.brandRep || "Brand Team",
      status: "pending"
    }
  });

  const { envelopeId } = await provider.sendSignatureRequest({
    pdfUrl: contract.pdfUrl,
    signerEmail: record.signerEmail,
    signerName: record.signerName,
    contractId: contract.id
  });

  await prisma.signatureRequest.update({
    where: { id: record.id },
    data: {
      envelopeId,
      status: "sent"
    }
  });

  return { envelopeId, requestId: record.id };
}
