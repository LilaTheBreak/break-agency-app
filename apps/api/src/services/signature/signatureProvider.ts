export interface SignatureProvider {
  sendSignatureRequest(args: {
    pdfUrl: string;
    signerEmail: string;
    signerName: string;
    contractId: string;
  }): Promise<{ envelopeId: string }>;

  getSignedPdf(envelopeId: string): Promise<Buffer | null>;

  parseWebhook(req: any): Promise<{
    envelopeId: string;
    status: string;
  }>;
}
