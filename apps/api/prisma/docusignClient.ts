import { signatureWebhookQueue } from '../../worker/queues/signatureQueue.js';

const DOCUSIGN_API_KEY = process.env.DOCUSIGN_API_KEY;

/**
 * A stub for a DocuSign API client.
 */
export const docusignClient = {
  /**
   * Creates and sends an envelope for signature.
   */
  sendEnvelope: async (payload: any) => {
    const envelopeId = `ds_env_${Date.now()}`;
    console.log(`[DOCUSIGN STUB] Creating and sending envelope ${envelopeId} for subject: "${payload.emailSubject}"`);

    if (!DOCUSIGN_API_KEY) {
      console.log('[DOCUSIGN STUB] Sandbox mode: Simulating signature completion in 3 seconds.');
      // Simulate a 'completed' webhook event after a short delay
      await signatureWebhookQueue.add('docusign-webhook', {
        event: 'envelope-completed',
        payload: { envelopeId, status: 'completed' },
      }, { delay: 3000 });
    }

    return { envelopeId, status: 'sent' };
  },

  /**
   * Retrieves the status of an envelope.
   */
  getEnvelopeStatus: async (envelopeId: string) => {
    console.log(`[DOCUSIGN STUB] Getting status for envelope ${envelopeId}`);
    return { status: 'sent' }; // Mock response
  },

  /**
   * Downloads the signed PDF document from a completed envelope.
   */
  downloadSignedPDF: async (envelopeId: string): Promise<Buffer> => {
    console.log(`[DOCUSIGN STUB] Downloading signed PDF for envelope ${envelopeId}`);
    // In a real app, this would return the PDF buffer. Here we return a dummy buffer.
    return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 52 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Signed Document Stub) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000121 00000 n \n0000000200 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n283\n%%EOF');
  },
};