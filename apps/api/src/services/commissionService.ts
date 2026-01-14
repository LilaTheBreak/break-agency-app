import prisma from '../lib/prisma';
import { generateId } from '../lib/utils';

/**
 * Commission Calculation Service
 * 
 * Calculates commissions deterministically based on deal value and agent involvement.
 * 
 * Commission Structure:
 * - Talent Commission: 80% of deal value (paid to talent)
 * - Agency Commission: 15% of deal value (agency fee)
 * - Agent Commission: 5% of deal value (agent who managed the deal)
 * 
 * All commissions are calculated when an invoice is marked as paid.
 */

export interface CommissionCalculationResult {
  talentCommission: {
    amount: number;
    percentage: number;
  };
  agencyCommission: {
    amount: number;
    percentage: number;
  };
  agentCommission: {
    amount: number;
    percentage: number;
    agentId: string | null;
  };
  total: number;
}

/**
 * Commission rates (configurable constants)
 */
const COMMISSION_RATES = {
  TALENT: 0.80,    // 80% to talent
  AGENCY: 0.15,    // 15% agency fee
  AGENT: 0.05,     // 5% to agent
} as const;

/**
 * Calculates commission breakdown for a deal
 * @param dealValue - The total deal value
 * @param agentId - The ID of the agent who managed the deal (from Deal.userId)
 * @returns Commission breakdown
 */
export function calculateCommissions(
  dealValue: number,
  agentId: string | null
): CommissionCalculationResult {
  const talentAmount = Math.round(dealValue * COMMISSION_RATES.TALENT * 100) / 100;
  const agencyAmount = Math.round(dealValue * COMMISSION_RATES.AGENCY * 100) / 100;
  const agentAmount = Math.round(dealValue * COMMISSION_RATES.AGENT * 100) / 100;

  // Ensure total equals deal value (handle rounding)
  const total = talentAmount + agencyAmount + agentAmount;
  const roundingDiff = dealValue - total;
  
  // Add rounding difference to agency commission
  const adjustedAgencyAmount = agencyAmount + roundingDiff;

  return {
    talentCommission: {
      amount: talentAmount,
      percentage: COMMISSION_RATES.TALENT * 100,
    },
    agencyCommission: {
      amount: adjustedAgencyAmount,
      percentage: COMMISSION_RATES.AGENCY * 100,
    },
    agentCommission: {
      amount: agentAmount,
      percentage: COMMISSION_RATES.AGENT * 100,
      agentId,
    },
    total: dealValue,
  };
}

/**
 * Creates commission records for a paid invoice
 * @param invoiceId - The invoice ID
 * @param dealId - The deal ID
 * @param talentId - The talent ID
 * @param agentId - The agent ID (from Deal.userId)
 * @param dealValue - The deal value
 * @returns Created commission records
 */
export async function createCommissionsForPaidInvoice(
  invoiceId: string,
  dealId: string,
  talentId: string,
  agentId: string | null,
  dealValue: number
): Promise<Array<{ id: string; type: string; amount: number }>> {
  const calculation = calculateCommissions(dealValue, agentId);
  const currency = "USD"; // Default currency - could be derived from invoice/deal

  const commissions = [];

  // 1. Create talent commission (always created)
  const talentCommission = await prisma.commission.create({
    data: {
      id: generateId("comm"),
      dealId,
      invoiceId,
      talentId,
      agentId: null, // Talent commission is not tied to an agent
      amount: calculation.talentCommission.amount,
      percentage: calculation.talentCommission.percentage,
      currency,
      status: "pending", // Will be approved when payout is created
      calculatedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  commissions.push({ id: talentCommission.id, type: "talent", amount: calculation.talentCommission.amount });

  // 2. Create agency commission (internal, not paid out)
  const agencyCommission = await prisma.commission.create({
    data: {
      id: generateId("comm"),
      dealId,
      invoiceId,
      talentId, // Agency commission is still associated with the talent/deal
      agentId: null, // Agency commission is not tied to an agent
      amount: calculation.agencyCommission.amount,
      percentage: calculation.agencyCommission.percentage,
      currency,
      status: "approved", // Agency commission is automatically approved (internal)
      calculatedAt: new Date(),
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  commissions.push({ id: agencyCommission.id, type: "agency", amount: calculation.agencyCommission.amount });

  // 3. Create agent commission (only if agent exists)
  if (agentId) {
    const agentCommission = await prisma.commission.create({
      data: {
        id: generateId("comm"),
        dealId,
        invoiceId,
        talentId,
        agentId,
        amount: calculation.agentCommission.amount,
        percentage: calculation.agentCommission.percentage,
        currency,
        status: "pending", // Will be approved when payout is created
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    commissions.push({ id: agentCommission.id, type: "agent", amount: calculation.agentCommission.amount });
  }

  return commissions;
}

/**
 * Gets all commissions for a deal
 */
export async function getCommissionsForDeal(dealId: string) {
  return prisma.commission.findMany({
    where: { dealId },
    include: {
      Talent: {
        select: {
          id: true,
          name: true,
        },
      },
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      Invoice: {
        select: {
          id: true,
          invoiceNumber: true,
        },
      },
      Payout: {
        select: {
          id: true,
          status: true,
          paidAt: true,
        },
      },
    },
    orderBy: { calculatedAt: "desc" },
  });
}

/**
 * Gets all commissions for a talent
 */
export async function getCommissionsForTalent(talentId: string) {
  return prisma.commission.findMany({
    where: { talentId },
    include: {
      Deal: {
        select: {
          id: true,
          brandName: true,
          value: true,
        },
      },
      Invoice: {
        select: {
          id: true,
          invoiceNumber: true,
        },
      },
      Payout: {
        select: {
          id: true,
          status: true,
          paidAt: true,
        },
      },
    },
    orderBy: { calculatedAt: "desc" },
  });
}

/**
 * Gets all commissions for an agent
 */
export async function getCommissionsForAgent(agentId: string) {
  return prisma.commission.findMany({
    where: { agentId },
    include: {
      Deal: {
        select: {
          id: true,
          brandName: true,
          value: true,
        },
      },
      Talent: {
        select: {
          id: true,
          name: true,
        },
      },
      Invoice: {
        select: {
          id: true,
          invoiceNumber: true,
        },
      },
      Payout: {
        select: {
          id: true,
          status: true,
          paidAt: true,
        },
      },
    },
    orderBy: { calculatedAt: "desc" },
  });
}

/**
 * Links commissions to a payout
 * @param payoutId - The payout ID
 * @param commissionIds - Array of commission IDs to link
 */
export async function linkCommissionsToPayout(
  payoutId: string,
  commissionIds: string[]
): Promise<void> {
  await prisma.commission.updateMany({
    where: {
      id: { in: commissionIds },
    },
    data: {
      payoutId,
      status: "approved",
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Marks commissions as paid when payout is completed
 * @param payoutId - The payout ID
 */
export async function markCommissionsAsPaid(payoutId: string): Promise<void> {
  await prisma.commission.updateMany({
    where: {
      payoutId,
      status: "approved",
    },
    data: {
      status: "paid",
      paidAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

