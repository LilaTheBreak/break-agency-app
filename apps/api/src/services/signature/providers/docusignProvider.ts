import crypto from "crypto";
import { SignatureProvider } from "../signatureProvider.js";

export const docusignProvider: SignatureProvider = {
  async sendSignatureRequest() {
    const envelopeId = "env-" + crypto.randomUUID();
    return { envelopeId };
  },

  async getSignedPdf() {
    return null;
  },

  async parseWebhook(req: any) {
    const body = req.body;
    return {
      envelopeId: body?.envelopeId,
      status: body?.status || "unknown"
    };
  }
};
