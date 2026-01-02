import prisma from "../../lib/prisma.js";

export default {
  name: "logNegotiation",
  async run({ deal, stepResult, user }) {
    // Note: negotiationLog model doesn't exist - using AuditLog instead
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          action: "NEGOTIATION_LOG",
          entityType: "Deal",
          entityId: deal?.id ?? null,
          metadata: {
            step: "negotiation",
            input: deal,
            output: stepResult
          }
        }
      });
    } catch (error) {
      console.error("Failed to log negotiation:", error);
      // Don't fail the action if logging fails
    }

    return { logged: true };
  }
};
