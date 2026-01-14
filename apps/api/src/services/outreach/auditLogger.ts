import prisma from '../../lib/prisma.js';

/**
 * Audit log types for outreach operations
 */
export enum OutreachAuditAction {
  STAGE_CHANGE = "stage_change",
  OPPORTUNITY_CREATED = "opportunity_created",
  OPPORTUNITY_CLOSED = "opportunity_closed",
  DEAL_CONVERTED = "deal_converted",
  OUTREACH_ARCHIVED = "outreach_archived",
  OUTREACH_RESTORED = "outreach_restored",
  EMAIL_THREAD_LINKED = "email_thread_linked"
}

interface AuditLogData {
  action: OutreachAuditAction;
  entityType: "outreach" | "opportunity" | "deal";
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
}

/**
 * Log outreach-related admin actions for audit trail
 * 
 * @param data - Audit log data
 * @returns Promise<void>
 * 
 * @example
 * await logOutreachAudit({
 *   action: OutreachAuditAction.STAGE_CHANGE,
 *   entityType: "outreach",
 *   entityId: outreachId,
 *   userId: req.user.id,
 *   previousState: { stage: "cold" },
 *   newState: { stage: "warm" }
 * });
 */
export async function logOutreachAudit(data: AuditLogData): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      metadata: data.metadata || {},
      previousState: data.previousState,
      newState: data.newState
    };

    // Log to console for now (can be extended to database table or external service)
    console.log("[OUTREACH_AUDIT]", JSON.stringify(logEntry, null, 2));

    // Optional: Store in a dedicated audit_log table if it exists
    // await prisma.auditLog.create({ data: logEntry });
  } catch (error) {
    // Don't throw - audit logging should never break business logic
    console.error("[OUTREACH_AUDIT] Failed to log:", error);
  }
}

/**
 * Helper to log stage changes
 */
export async function logStageChange(
  outreachId: string,
  userId: string,
  oldStage: string,
  newStage: string
) {
  await logOutreachAudit({
    action: OutreachAuditAction.STAGE_CHANGE,
    entityType: "outreach",
    entityId: outreachId,
    userId,
    previousState: { stage: oldStage },
    newState: { stage: newStage },
    metadata: { timestamp: Date.now() }
  });
}

/**
 * Helper to log opportunity close
 */
export async function logOpportunityClose(
  opportunityId: string,
  userId: string,
  status: string,
  reason?: string
) {
  await logOutreachAudit({
    action: OutreachAuditAction.OPPORTUNITY_CLOSED,
    entityType: "opportunity",
    entityId: opportunityId,
    userId,
    newState: { status, reason },
    metadata: { timestamp: Date.now() }
  });
}

/**
 * Helper to log deal conversion
 */
export async function logDealConversion(
  opportunityId: string,
  dealId: string,
  userId: string,
  value: number,
  currency: string
) {
  await logOutreachAudit({
    action: OutreachAuditAction.DEAL_CONVERTED,
    entityType: "deal",
    entityId: dealId,
    userId,
    metadata: {
      opportunityId,
      value,
      currency,
      timestamp: Date.now()
    }
  });
}
