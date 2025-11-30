import { Router } from "express";
import prisma from "../lib/prisma.js";
import { docusignProvider } from "../services/signature/providers/docusignProvider.js";
import { nativeProvider } from "../services/signature/providers/nativeProvider.js";
import { uploadBufferToS3 } from "../services/s3Upload.js";
import { sendSlackAlert } from "../integrations/slack/slackClient.js";

const router = Router();

router.post("/signature", async (req, res) => {
  const provider = process.env.SIGN_PROVIDER === "docusign" ? docusignProvider : nativeProvider;

  const { envelopeId, status } = await provider.parseWebhook(req);

  if (!envelopeId) return res.json({ ok: true });

  const record = await prisma.signatureRequest.findFirst({
    where: { envelopeId }
  });

  if (!record) return res.json({ ok: true });

  await prisma.signatureRequest.update({
    where: { id: record.id },
    data: { status }
  });

  if (status === "signed") {
    const pdf = await provider.getSignedPdf(envelopeId);
    if (pdf) {
      const key = `contracts/signed/${record.id}.pdf`;
      const pdfUrl = await uploadBufferToS3(pdf as Buffer, key);

      await prisma.signatureRequest.update({
        where: { id: record.id },
        data: { signedPdfUrl: pdfUrl }
      });

      await prisma.contract.update({
        where: { id: record.contractId },
        data: { status: "signed" }
      });

      const contract = await prisma.contract.findUnique({ where: { id: record.contractId } });
      if (contract?.dealId) {
        await prisma.deal.update({
          where: { id: contract.dealId },
          data: { status: "Closed Won" }
        });
      }

      await sendSlackAlert("Deal Closed", {
        dealId: contract?.dealId,
        contractId: record.contractId,
        signer: record.signerEmail
      });
    }
  }

  return res.json({ ok: true });
});

export default router;
