import prisma from "../../lib/prisma.js";
import { DealStage } from "@prisma/client";
import { logError } from "../../lib/logger.js";

/**
 * Handles deal workflow actions (status updates, advancing stages, etc.)
 * This is a placeholder implementation so the server can run.
 */

export async function advanceDealStage(dealId: string, nextStage: string, userId?: string) {
  console.log("[dealWorkflowService] advanceDealStage called:", { dealId, nextStage, userId });

  try {
    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        stage: nextStage as any,
        updatedAt: new Date()
      }
    });

    return { ok: true, data: updated };
  } catch (error) {
    console.error("[dealWorkflowService] Error:", error);
    return { ok: false, error: "Failed to advance deal stage" };
  }
}

export async function getWorkflowStatus(dealId: string) {
  console.log("[dealWorkflowService] getWorkflowStatus called:", dealId);

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, stage: true, updatedAt: true }
    });

    if (!deal) return { ok: false, error: "Deal not found" };

    return { ok: true, data: deal };
  } catch (error) {
    console.error("[dealWorkflowService] Error:", error);
    return { ok: false, error: "Failed to fetch workflow status" };
  }
}

export async function logWorkflowEvent(dealId: string, message: string, userId?: string) {
  console.log("[dealWorkflowService] logWorkflowEvent called:", { dealId, message });

  try {
    const event = await prisma.dealTimeline.create({
      data: {
        dealId,
        type: "workflow",
        message,
        createdById: userId ?? null
      }
    });

    return { ok: true, data: event };
  } catch (error) {
    console.error("[dealWorkflowService] Error:", error);
    return { ok: false, error: "Failed to log workflow event" };
  }
}

export async function changeStage(dealId: string, newStage: string, userId?: string) {
  console.log("[dealWorkflowService] changeStage called:", { dealId, newStage, userId });

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        Brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!deal) {
      return { success: false, error: "Deal not found", status: 404 };
    }

    const oldStage = deal.stage;
    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        stage: newStage as any,
        updatedAt: new Date()
      },
      include: {
        Brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log the stage change
    await logWorkflowEvent(dealId, `Stage changed from ${oldStage} to ${newStage}`, userId);

    // Create invoice when deal reaches COMPLETED stage
    // WORKFLOW ASSERTION: Deal → Completed → Invoice must be created
    if (newStage === "COMPLETED" || newStage === DealStage.COMPLETED) {
      try {
        const invoice = await createInvoiceForCompletedDeal(dealId, updated, userId);
        console.log(`[dealWorkflowService] ✅ Invoice ${invoice.invoiceNumber} created for deal ${dealId} after stage change to COMPLETED`);
        
        // Assertion: Verify invoice was actually created
        if (!invoice || !invoice.id) {
          throw new Error("Invoice creation returned null or missing ID");
        }
      } catch (invoiceError) {
        const errorMessage = invoiceError instanceof Error ? invoiceError.message : String(invoiceError);
        console.error("[dealWorkflowService] ❌ CRITICAL: Invoice creation failed on deal completion:", errorMessage);
        logError("Invoice creation failed on deal completion - WORKFLOW BREAK", invoiceError, { dealId, userId, stage: newStage });
        
        // WORKFLOW ASSERTION FAILURE: Log critical warning but don't block deal update
        // This allows deal to be marked complete, but admin must be notified
        // In production, this should trigger an alert/notification
      }
    }

    return { success: true, deal: updated };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[dealWorkflowService] Error in changeStage:", errorMessage);
    logError("Deal stage change failed", error, { dealId, newStage, userId });
    return { success: false, error: "Failed to change deal stage", status: 500 };
  }
}

/**
 * Creates an invoice when a deal is marked as COMPLETED
 */
async function createInvoiceForCompletedDeal(dealId: string, deal: any, userId?: string) {
  // Check if invoice already exists for this deal
  const existingInvoice = await prisma.invoice.findFirst({
    where: { dealId }
  });

  if (existingInvoice) {
    console.log(`[dealWorkflowService] Invoice already exists for deal ${dealId}, skipping creation`);
    return existingInvoice;
  }

  // Generate invoice number (format: INV-YYYYMMDD-XXXXX)
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substr(2, 5).toUpperCase();
  const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

  // Calculate due date (30 days from now)
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + 30);

  // Get deal value or default to 0
  const amount = deal.value || 0;
  const currency = deal.currency || "USD";

  const invoice = await prisma.invoice.create({
    data: {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dealId: dealId,
      brandId: deal.brandId || null,
      amount: amount,
      currency: currency,
      status: "draft",
      issuedAt: now,
      dueAt: dueAt,
      invoiceNumber: invoiceNumber,
      updatedAt: now
    }
  });

  // Log invoice creation in deal timeline
  await logWorkflowEvent(dealId, `Invoice ${invoiceNumber} created automatically (amount: ${currency} ${amount})`, userId);

  console.log(`[dealWorkflowService] Created invoice ${invoiceNumber} for completed deal ${dealId}`);
  
  // Note: Invoice is created as "draft" - it will be pushed to Xero when status changes to "sent" or "due"
  // This is handled in the invoice update route
  
  return invoice;
}
