import prisma from '../../lib/prisma.js';
import { getBalance, debitCreator } from './balanceLedger.js';

const PAYOUT_THRESHOLD = 10000; // e.g., £100 in pence/cents

/**
 * Initiates a payout for a user if their balance exceeds the threshold.
 * @param userId - The ID of the user to run the payout for.
 */
export async function runPayout(userId: string) {
  const balance = await getBalance(userId);

  if (balance.available >= PAYOUT_THRESHOLD) {
    const payoutAmount = balance.available;
    console.log(`[PAYOUT ENGINE] Initiating payout of ${payoutAmount} for user ${userId}`);

    // 1. Create a Payout record
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount: payoutAmount,
        currency: 'gbp', // Assuming GBP
        status: 'processing',
        referenceId: `payout_${Date.now()}`,
      },
    });

    // 2. Debit the creator's balance
    await debitCreator(userId, payoutAmount);

    // 3. In a real app, call Stripe Connect API to transfer funds here.
    console.log(`[PAYOUT ENGINE] Payout ${payout.id} created. Stripe call would be made here.`);
    return payout;
  }
  return null;
}