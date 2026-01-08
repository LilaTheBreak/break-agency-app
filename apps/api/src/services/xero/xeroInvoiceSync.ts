import prisma from "../../lib/prisma.js";
import { createXeroInvoice } from "./xeroService.js";
import { logError } from "../../lib/logger.js";

/**
 * Pushes an invoice to Xero when it's created or updated
 */
export async function pushInvoiceToXero(invoiceId: string): Promise<{
  success: boolean;
  xeroId?: string;
  error?: string;
}> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        Deal: {
          include: {
            Brand: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Skip if already synced to Xero
    if (invoice.xeroId) {
      return { success: true, xeroId: invoice.xeroId };
    }

    // Only push invoices that are not in draft status
    if (invoice.status === "draft") {
      return { success: false, error: "Cannot push draft invoices to Xero" };
    }

    // Get contact information
    const contactName = invoice.Deal?.Brand?.name || "Unknown Brand";
    const contactEmail = (invoice.Deal?.Brand as any)?.email || null;

    // Create invoice in Xero
    const xeroResult = await createXeroInvoice({
      invoiceNumber: invoice.invoiceNumber,
      contactName,
      contactEmail: contactEmail || undefined,
      amount: invoice.amount,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      description: `Invoice for deal: ${invoice.Deal?.brandName || invoice.invoiceNumber}`
    });

    // Update invoice with Xero ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xeroId: xeroResult.invoiceId,
        lastSyncedAt: new Date(),
        xeroSyncError: null
      }
    });

    return { success: true, xeroId: xeroResult.invoiceId };
  } catch (error: any) {
    logError("Failed to push invoice to Xero", error, { invoiceId });

    // Store error in invoice record
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xeroSyncError: error.message || "Failed to push to Xero"
      }
    }).catch(() => {
      // Ignore update errors
    });

    return { success: false, error: error.message || "Failed to push invoice to Xero" };
  }
}

/**
 * Syncs all unpaid invoices with Xero payment status
 */
export async function syncAllXeroInvoices(): Promise<{
  synced: number;
  updated: number;
  errors: number;
}> {
  const { syncXeroPaymentStatuses } = await import("./xeroService.js");
  return await syncXeroPaymentStatuses();
}

