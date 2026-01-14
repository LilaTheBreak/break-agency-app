import crypto from "crypto";
import { SignatureProvider } from '../signatureProvider';

export const nativeProvider: SignatureProvider = {
  async sendSignatureRequest() {
    const envelopeId = "native-" + crypto.randomUUID();
    return { envelopeId };
  },

  async getSignedPdf() {
    return null;
  },

  async parseWebhook(req: any) {
    return {
      envelopeId: req.body?.envelopeId,
      status: req.body?.status || "pending"
    };
  }
};
