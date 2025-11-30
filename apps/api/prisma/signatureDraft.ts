import prisma from '../../lib/prisma.js';

/**
 * Creates a draft signature request record in the database.
 * @param contractReviewId - The ID of the contract being sent.
 * @param context - Information about the signer.
 * @returns The newly created SignatureRequest record.
 */
export async function createSignatureDraft(contractReviewId: string, context: { signerEmail: string; signerName: string }) {
  console.log(`[SIGNATURE DRAFT] Creating draft signature request for ${context.signerEmail}`);

  const contract = await prisma.contract.findFirst({ where: { contractReviewId } });
  if (!contract) throw new Error('Associated contract record not found.');

  return prisma.signatureRequest.create({
    data: {
      contractId: contract.id,
      provider: 'docusign',
      status: 'draft',
      signerEmail: context.signerEmail,
      signerName: context.signerName,
    },
  });
}