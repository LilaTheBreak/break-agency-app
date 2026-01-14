import prisma from '../../lib/prisma';
import { docusignProvider } from './providers/docusignProvider';
import { nativeProvider } from './providers/nativeProvider';

function providerFromEnv() {
  return process.env.SIGN_PROVIDER === "docusign" ? docusignProvider : nativeProvider;
}

export async function initiateSignature(contract: any) {
  const provider = providerFromEnv();

  // Phase 5: Fix schema mismatch - SignatureRequest needs userId and documentUrl
  const userId = contract.userId || contract.createdBy || "system";
  const documentUrl = contract.pdfUrl || contract.documentUrl || "";
  
  if (!documentUrl) {
    throw new Error("Contract PDF URL is required for signature");
  }

  const signerEmail = (contract.terms as any)?.brandEmail || 
                     (contract.terms as any)?.talentEmail || 
                     "signer@example.com";
  const signerName = (contract.terms as any)?.brandRep || 
                    (contract.terms as any)?.talentName || 
                    "Signer";

  const record = await prisma.signatureRequest.create({
    data: {
      id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: String(userId || ""),
      contractId: contract.id,
      documentUrl: String(documentUrl),
      signerEmail: String(signerEmail),
      status: "pending",
      updatedAt: new Date(),
      metadata: {
        provider: process.env.SIGN_PROVIDER || "native",
        signerName
      }
    }
  });

  const { envelopeId } = await provider.sendSignatureRequest({
    pdfUrl: documentUrl,
    signerEmail: record.signerEmail,
    signerName: signerName,
    contractId: contract.id
  });

  await prisma.signatureRequest.update({
    where: { id: record.id },
    data: {
      status: "sent",
      metadata: {
        ...(record.metadata as any || {}),
        envelopeId
      }
    }
  });

  // Update contract with envelope ID
  if (contract.id) {
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        envelopeId: envelopeId,
        status: "pending_signature",
        updatedAt: new Date()
      }
    });
  }

  return { envelopeId, requestId: record.id };
}
