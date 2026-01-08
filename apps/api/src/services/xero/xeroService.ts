import axios from "axios";
import type { AxiosInstance } from "axios";
import prisma from "../../lib/prisma.js";
import { getXeroToken } from "./xeroAuth.js";

/**
 * Xero API Service
 * Handles invoice creation, updates, and payment status syncing
 */

interface XeroInvoice {
  InvoiceID?: string;
  InvoiceNumber?: string;
  Type: "ACCREC" | "ACCPAY"; // Accounts Receivable or Accounts Payable
  Contact: {
    ContactID?: string;
    Name: string;
    EmailAddress?: string;
  };
  Date: string; // ISO date string
  DueDate: string; // ISO date string
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    AccountCode: string; // Xero account code (e.g., "200" for Sales)
  }>;
  Status?: "DRAFT" | "SUBMITTED" | "AUTHORISED" | "PAID" | "VOIDED";
  CurrencyCode?: string;
  Total?: number;
}

interface XeroPayment {
  PaymentID: string;
  Invoice: {
    InvoiceID: string;
    InvoiceNumber: string;
  };
  Account: {
    Code: string;
  };
  Date: string;
  Amount: number;
  CurrencyRate?: number;
}

/**
 * Gets authenticated Xero API client
 */
async function getXeroClient(): Promise<{ client: any; tenantId: string } | null> {
  const tokenData = await getXeroToken();
  if (!tokenData) {
    return null;
  }

  const client = axios.create({
    baseURL: "https://api.xero.com/api.xro/2.0",
    headers: {
      "Authorization": `Bearer ${tokenData.accessToken}`,
      "Xero-tenant-id": tokenData.tenantId,
      "Content-Type": "application/json"
    }
  });

  return { client, tenantId: tokenData.tenantId };
}

/**
 * Creates an invoice in Xero
 */
export async function createXeroInvoice(invoiceData: {
  invoiceNumber: string;
  contactName: string;
  contactEmail?: string;
  amount: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  description: string;
}): Promise<{ invoiceId: string; invoiceNumber: string }> {
  const xeroClient = await getXeroClient();
  if (!xeroClient) {
    throw new Error("Xero not connected");
  }

  // Find or create contact in Xero
  let contactId: string | undefined;
  try {
    const contactsResponse = await xeroClient.client.get("/Contacts", {
      params: {
        where: `Name="${invoiceData.contactName}"`
      }
    });

    const contacts = contactsResponse.data.Contacts;
    if (contacts && contacts.length > 0) {
      contactId = contacts[0].ContactID;
    } else {
      // Create contact
      const createContactResponse = await xeroClient.client.post("/Contacts", {
        Contacts: [{
          Name: invoiceData.contactName,
          EmailAddress: invoiceData.contactEmail,
          IsCustomer: true
        }]
      });
      contactId = createContactResponse.data.Contacts[0].ContactID;
    }
  } catch (error: any) {
    console.error("[XERO] Failed to find/create contact:", error);
    throw new Error(`Failed to find/create Xero contact: ${error.message}`);
  }

  // Create invoice
  const xeroInvoice: XeroInvoice = {
    Type: "ACCREC", // Accounts Receivable
    Contact: {
      ContactID: contactId,
      Name: invoiceData.contactName,
      EmailAddress: invoiceData.contactEmail
    },
    Date: invoiceData.issuedAt.toISOString().split("T")[0],
    DueDate: invoiceData.dueAt.toISOString().split("T")[0],
    InvoiceNumber: invoiceData.invoiceNumber,
    LineItems: [{
      Description: invoiceData.description,
      Quantity: 1,
      UnitAmount: invoiceData.amount,
      AccountCode: "200" // Sales account (default - should be configurable)
    }],
    Status: "AUTHORISED", // Authorized and ready to send
    CurrencyCode: invoiceData.currency.toUpperCase()
  };

  try {
    const response = await xeroClient.client.post("/Invoices", {
      Invoices: [xeroInvoice]
    });

    const createdInvoice = response.data.Invoices[0];
    return {
      invoiceId: createdInvoice.InvoiceID,
      invoiceNumber: createdInvoice.InvoiceNumber || invoiceData.invoiceNumber
    };
  } catch (error: any) {
    console.error("[XERO] Failed to create invoice:", error);
    throw new Error(`Failed to create Xero invoice: ${error.response?.data?.Message || error.message}`);
  }
}

/**
 * Gets invoice payment status from Xero
 */
export async function getXeroInvoiceStatus(xeroInvoiceId: string): Promise<{
  status: "DRAFT" | "SUBMITTED" | "AUTHORISED" | "PAID" | "VOIDED";
  paidAt?: Date;
  totalPaid?: number;
}> {
  const xeroClient = await getXeroClient();
  if (!xeroClient) {
    throw new Error("Xero not connected");
  }

  try {
    const response = await xeroClient.client.get(`/Invoices/${xeroInvoiceId}`);
    const invoice = response.data.Invoices[0];

    // Get payments for this invoice
    let paidAt: Date | undefined;
    let totalPaid = 0;

    if (invoice.AmountPaid && invoice.AmountPaid > 0) {
      try {
        const paymentsResponse = await xeroClient.client.get("/Payments", {
          params: {
            where: `Invoice.InvoiceID=Guid("${xeroInvoiceId}")`
          }
        });

        const payments = paymentsResponse.data.Payments || [];
        if (payments.length > 0) {
          // Get the most recent payment date
          const latestPayment = payments.reduce((latest: XeroPayment, current: XeroPayment) => {
            return new Date(current.Date) > new Date(latest.Date) ? current : latest;
          });
          paidAt = new Date(latestPayment.Date);
          totalPaid = invoice.AmountPaid;
        }
      } catch (paymentError) {
        console.warn("[XERO] Failed to fetch payment details:", paymentError);
        // Continue without payment details
      }
    }

    return {
      status: invoice.Status,
      paidAt,
      totalPaid
    };
  } catch (error: any) {
    console.error("[XERO] Failed to get invoice status:", error);
    throw new Error(`Failed to get Xero invoice status: ${error.response?.data?.Message || error.message}`);
  }
}

/**
 * Syncs payment status for all invoices with Xero IDs
 */
export async function syncXeroPaymentStatuses(): Promise<{
  synced: number;
  updated: number;
  errors: number;
}> {
  const stats = { synced: 0, updated: 0, errors: 0 };

  try {
    // Get all invoices with Xero IDs that are not paid
    const invoices = await prisma.invoice.findMany({
      where: {
        xeroId: { not: null },
        status: { not: "paid" }
      }
    });

    for (const invoice of invoices) {
      if (!invoice.xeroId) continue;

      try {
        const xeroStatus = await getXeroInvoiceStatus(invoice.xeroId);

        // Update invoice if status changed
        if (xeroStatus.status === "PAID" && invoice.status !== "paid") {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "paid",
              paidAt: xeroStatus.paidAt || new Date(),
              lastSyncedAt: new Date(),
              xeroSyncError: null
            }
          });
          stats.updated++;
        } else if (invoice.status !== "paid") {
          // Update last synced time even if status didn't change
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              lastSyncedAt: new Date(),
              xeroSyncError: null
            }
          });
        }

        stats.synced++;
      } catch (error: any) {
        console.error(`[XERO] Failed to sync invoice ${invoice.id}:`, error);
        
        // Store error in invoice record
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            xeroSyncError: error.message || "Sync failed"
          }
        });
        
        stats.errors++;
      }
    }

    // Update last synced time for connection
    await prisma.xeroConnection.updateMany({
      where: { connected: true },
      data: {
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return stats;
  } catch (error) {
    console.error("[XERO] Failed to sync payment statuses:", error);
    throw error;
  }
}

