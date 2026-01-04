import axios, { AxiosInstance } from "axios";
import { SignatureProvider } from "../signatureProvider.js";
import { getDocuSignToken } from "../docusignAuth.js";

/**
 * DocuSign Signature Provider
 * Implements real DocuSign API integration for e-signatures
 */

interface DocuSignEnvelope {
  emailSubject: string;
  documents: Array<{
    documentBase64: string;
    name: string;
    fileExtension: string;
    documentId: string;
  }>;
  recipients: {
    signers: Array<{
      email: string;
      name: string;
      recipientId: string;
      routingOrder: string;
      tabs: {
        signHereTabs: Array<{
          documentId: string;
          pageNumber: string;
          xPosition: string;
          yPosition: string;
        }>;
      };
    }>;
  };
  status: "sent";
}

/**
 * Gets authenticated DocuSign API client
 */
async function getDocuSignClient(): Promise<{ client: AxiosInstance; accountId: string } | null> {
  const tokenData = await getDocuSignToken();
  if (!tokenData) {
    return null;
  }

  const client = axios.create({
    baseURL: `${tokenData.baseUrl}/v2.1/accounts/${tokenData.accountId}`,
    headers: {
      "Authorization": `Bearer ${tokenData.accessToken}`,
      "Content-Type": "application/json"
    }
  });

  return { client, accountId: tokenData.accountId };
}

/**
 * Downloads PDF from URL and converts to base64
 */
async function downloadPdfAsBase64(pdfUrl: string): Promise<string> {
  try {
    const response = await axios.get(pdfUrl, {
      responseType: "arraybuffer"
    });
    const buffer = Buffer.from(response.data);
    return buffer.toString("base64");
  } catch (error) {
    throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export const docusignProvider: SignatureProvider = {
  /**
   * Sends a signature request to DocuSign
   */
  async sendSignatureRequest({
    pdfUrl,
    signerEmail,
    signerName,
    contractId
  }): Promise<{ envelopeId: string }> {
    const docusignClient = await getDocuSignClient();
    if (!docusignClient) {
      throw new Error("DocuSign not connected. Please authenticate first.");
    }

    // Download PDF and convert to base64
    const pdfBase64 = await downloadPdfAsBase64(pdfUrl);

    // Create envelope
    const envelope: DocuSignEnvelope = {
      emailSubject: `Contract Signature Request - ${contractId}`,
      documents: [{
        documentBase64: pdfBase64,
        name: `contract-${contractId}.pdf`,
        fileExtension: "pdf",
        documentId: "1"
      }],
      recipients: {
        signers: [{
          email: signerEmail,
          name: signerName,
          recipientId: "1",
          routingOrder: "1",
          tabs: {
            signHereTabs: [{
              documentId: "1",
              pageNumber: "1",
              xPosition: "100",
              yPosition: "700"
            }]
          }
        }]
      },
      status: "sent"
    };

    try {
      const response = await docusignClient.client.post("/envelopes", envelope);
      return { envelopeId: response.data.envelopeId };
    } catch (error: any) {
      console.error("[DOCUSIGN] Failed to create envelope:", error);
      throw new Error(
        `Failed to create DocuSign envelope: ${error.response?.data?.message || error.message}`
      );
    }
  },

  /**
   * Gets the signed PDF from DocuSign
   */
  async getSignedPdf(envelopeId: string): Promise<Buffer | null> {
    const docusignClient = await getDocuSignClient();
    if (!docusignClient) {
      throw new Error("DocuSign not connected");
    }

    try {
      // Get the signed document
      const response = await docusignClient.client.get(
        `/envelopes/${envelopeId}/documents/combined`,
        {
          responseType: "arraybuffer"
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error("[DOCUSIGN] Failed to get signed PDF:", error);
      return null;
    }
  },

  /**
   * Parses DocuSign webhook payload
   */
  async parseWebhook(req: any): Promise<{
    envelopeId: string;
    status: string;
  }> {
    // DocuSign webhook format
    const body = req.body;
    
    // DocuSign sends webhooks in XML format by default, but can be configured for JSON
    // For simplicity, we'll handle JSON format here
    if (body.data) {
      // JSON format
      const envelopeId = body.data.envelopeId || body.envelopeId;
      const status = body.event || body.status || "unknown";
      
      // Map DocuSign statuses to our statuses
      const statusMap: Record<string, string> = {
        "sent": "sent",
        "delivered": "sent",
        "signed": "signed",
        "completed": "signed",
        "declined": "declined",
        "voided": "voided"
      };

      return {
        envelopeId,
        status: statusMap[status.toLowerCase()] || status
      };
    }

    // Fallback for XML or other formats
    return {
      envelopeId: body.envelopeId || "",
      status: body.status || "unknown"
    };
  }
};
