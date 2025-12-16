import prisma from '../../lib/prisma.js';

/**
 * Credits a creator's balance.
 * This would typically move funds from 'pending' to 'available' upon payment confirmation.
 * @param userId - The ID of the creator.
 * @param amount - The amount to credit.
 */
export async function creditCreator(userId: string, amount: number) {
  console.log(`[LEDGER] Crediting user ${userId} with ${amount}`);
  return prisma.creatorBalance.upsert({
    where: { userId },
    create: { userId, available: amount },
    update: { available: { increment: amount } },
  });
}

/**
 * Debits a creator's balance, typically during a payout.
 * @param userId - The ID of the creator.
 * @param amount - The amount to debit.
 */
export async function debitCreator(userId: string, amount: number) {
  console.log(`[LEDGER] Debiting user ${userId} with ${amount}`);
  const balance = await getBalance(userId);
  if (balance.available < amount) {
    throw new Error('Insufficient available balance for debit.');
  }
  return prisma.creatorBalance.update({
    where: { userId },
    data: { available: { decrement: amount } },
  });
}

/**
 * Retrieves the current balance for a creator.
 */
export async function getBalance(userId: string) {
  const balance = await prisma.creatorBalance.findUnique({ where: { userId } });
  return balance || { userId, available: 0, pending: 0 };
}