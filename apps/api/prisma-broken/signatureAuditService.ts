import prisma from '../../lib/prisma.js';

/**
 * Logs an event to the signature request's audit trail.
 */
export async function logSignatureEvent(requestId: string, event: string, actor: string) {
  const request = await prisma.signatureRequest.findUnique({ where: { id: requestId } });
  if (!request) return;

  const auditTrail = (request.auditTrail as any[]) || [];
  auditTrail.push({ event, actor, at: new Date().toISOString() });

  await prisma.signatureRequest.update({ where: { id: requestId }, data: { auditTrail } });
}