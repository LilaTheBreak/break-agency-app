import { Router } from "express";
import prisma from '../lib/prisma.js';
import { docusignProvider } from '../services/signature/providers/docusignProvider.js';
import { nativeProvider } from '../services/signature/providers/nativeProvider.js';
import { uploadFile } from '../services/storage/googleCloudStorage.js';
import { logError } from '../lib/logger.js';

const router = Router();

/**
 * DocuSign webhook handler
 * Handles signature status updates from DocuSign
 */
router.post("/signature", async (req, res) => {
  const enabled = process.env.CONTRACT_SIGNING_ENABLED === "true";
  if (!enabled) {
    return res.status(503).json({ 
      ok: false,
      error: "Contract signing is disabled"
    });
  }

  try {
    // DocuSign webhook signature validation
    // DocuSign sends HMAC signature in X-DocuSign-Signature header
    // For production, verify signature using DOCUSIGN_WEBHOOK_SECRET
    if (process.env.SIGN_PROVIDER === "docusign" && process.env.DOCUSIGN_WEBHOOK_SECRET) {
      const signature = req.headers["x-docusign-signature"] as string;
      const timestamp = req.headers["x-docusign-timestamp"] as string;
      
      if (signature && timestamp) {
        const crypto = await import("crypto");
        const hmac = crypto.createHmac("sha256", process.env.DOCUSIGN_WEBHOOK_SECRET!);
        hmac.update(timestamp + JSON.stringify(req.body));
        const expectedSignature = hmac.digest("base64");
        
        // Use timing-safe comparison
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
          console.warn("[DOCUSIGN WEBHOOK] Invalid signature");
          return res.status(401).json({ ok: false, error: "Invalid signature" });
        }
      }
    }

    const provider = process.env.SIGN_PROVIDER === "docusign" ? docusignProvider : nativeProvider;

    const { envelopeId, status } = await provider.parseWebhook(req);

    if (!envelopeId) {
      return res.json({ ok: true });
    }

    // Idempotency check: Check if this envelope status was already processed
    // by checking if signature request already has this status
    const existingRequest = await prisma.signatureRequest.findFirst({
      where: {
        metadata: {
          path: ["envelopeId"],
          equals: envelopeId
        }
      }
    });

    // If request exists and status matches, skip processing (idempotency)
    if (existingRequest && existingRequest.status === status) {
      console.log(`[SIGNATURE WEBHOOK] Envelope ${envelopeId} already processed with status ${status}, skipping`);
      return res.json({ ok: true });
    }

    // Find signature request by envelope ID (stored in metadata)
    // Note: Prisma JSON filtering may not work as expected, so we'll search all and filter
    const allRequests = await prisma.signatureRequest.findMany({
      where: {
        status: { in: ["pending", "sent", "signed", "completed", "declined", "voided"] }
      }
    });

    const record = allRequests.find(req => {
      const metadata = req.metadata as any;
      return metadata?.envelopeId === envelopeId;
    });

    if (!record) {
      console.warn(`[SIGNATURE WEBHOOK] No signature request found for envelope ${envelopeId}`);
      return res.json({ ok: true });
    }

    // Update signature request status
    await prisma.signatureRequest.update({
      where: { id: record.id },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    // Handle signed status
    if (status === "signed" || status === "completed") {
      try {
        // Get signed PDF from provider
        const pdf = await provider.getSignedPdf(envelopeId);
        
        if (pdf) {
          // Store signed PDF in GCS with versioning
          const contract = await prisma.contract.findUnique({
            where: { id: record.contractId || "" },
            select: { id: true, dealId: true, title: true }
          });

          if (contract) {
            // Upload signed PDF to GCS
            const filename = `contract-${contract.id}-signed-${Date.now()}.pdf`;
            const { uploadFile } = await import("../services/storage/googleCloudStorage.js");
            const uploadResult = await uploadFile(
              pdf,
              filename,
              "application/pdf",
              "contracts/signed",
              record.userId
            );

            // Update signature request with signed PDF URL
            await prisma.signatureRequest.update({
              where: { id: record.id },
              data: { 
                signedPdfUrl: uploadResult.signedUrl,
                signedAt: new Date()
              }
            });

            // Update contract with signed PDF and envelope ID
            await prisma.contract.update({
              where: { id: contract.id },
              data: { 
                signedPdfUrl: uploadResult.signedUrl,
                envelopeId: envelopeId,
                status: "fully_signed",
                fullySignedAt: new Date(),
                updatedAt: new Date()
              }
            });

            // Determine which party signed based on signer email
            const contractFull = await prisma.contract.findUnique({
              where: { id: contract.id },
              include: {
                Deal: {
                  include: {
                    Talent: { select: { primaryEmail: true } },
                    Brand: true
                  }
                }
              }
            });

            if (contractFull) {
              const isTalentSigner = (contractFull as any).Deal?.Talent?.primaryEmail === record.signerEmail;
              const isBrandSigner = false; // Brand doesn't have email in schema

              if (isTalentSigner && !contractFull.talentSignedAt) {
                await prisma.contract.update({
                  where: { id: contract.id },
                  data: { talentSignedAt: new Date() }
                });
              }

              if (isBrandSigner && !contractFull.brandSignedAt) {
                await prisma.contract.update({
                  where: { id: contract.id },
                  data: { brandSignedAt: new Date() }
                });
              }

              // Check if both parties signed
              const updatedContract = await prisma.contract.findUnique({
                where: { id: contract.id }
              });

              if (updatedContract?.talentSignedAt && updatedContract?.brandSignedAt) {
                await prisma.contract.update({
                  where: { id: contract.id },
                  data: { 
                    status: "fully_signed",
                    fullySignedAt: new Date()
                  }
                });
              } else if (updatedContract?.talentSignedAt || updatedContract?.brandSignedAt) {
                await prisma.contract.update({
                  where: { id: contract.id },
                  data: { status: "partially_signed" }
                });
              }
            }

            // Update deal if contract is fully signed
            if (contract.dealId) {
              const updatedContract = await prisma.contract.findUnique({
                where: { id: contract.id }
              });

              if (updatedContract?.status === "fully_signed") {
                await prisma.deal.update({
                  where: { id: contract.dealId },
                  data: { 
                    contractSignedAt: new Date(),
                    updatedAt: new Date()
                  }
                });
              }
            }
          }
        }
      } catch (pdfError) {
        logError("Failed to process signed PDF", pdfError, { envelopeId, signatureRequestId: record.id });
        // Continue - don't fail the webhook
      }
    }

    return res.json({ ok: true });
  } catch (error) {
    logError("Signature webhook error", error, {});
    // Always return 200 to DocuSign to prevent retries
    return res.json({ ok: true });
  }
});

export default router;
